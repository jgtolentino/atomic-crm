terraform {
  required_version = ">= 1.5.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = ">= 4.0.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Cloudflare API token with DNS edit permissions"
}

variable "zone_id" {
  type        = string
  description = "Cloudflare Zone ID for the domain"
}

variable "domain" {
  type        = string
  description = "Apex domain (e.g., insightpulseai.com)"
}

# =============================================================================
# Vercel Frontend (CNAME records)
# =============================================================================

resource "cloudflare_record" "www" {
  zone_id = var.zone_id
  name    = "www"
  type    = "CNAME"
  content = "cname.vercel-dns.com"
  ttl     = 1  # Auto TTL when proxied
  proxied = true
  comment = "Main website - Vercel"
}

resource "cloudflare_record" "app" {
  zone_id = var.zone_id
  name    = "app"
  type    = "CNAME"
  content = "cname.vercel-dns.com"
  ttl     = 1
  proxied = true
  comment = "Platform Kit UI - Vercel"
}

# Apex domain redirect to www (optional)
resource "cloudflare_record" "apex" {
  zone_id = var.zone_id
  name    = "@"
  type    = "CNAME"
  content = "cname.vercel-dns.com"
  ttl     = 1
  proxied = true
  comment = "Apex redirect to Vercel"
}

# =============================================================================
# DigitalOcean Droplets (A records)
# =============================================================================

resource "cloudflare_record" "plane" {
  zone_id = var.zone_id
  name    = "plane"
  type    = "A"
  content = var.plane_droplet_ip
  ttl     = 300
  proxied = false  # Direct connection for WebSocket support
  comment = "Plane CE - DO droplet plane-ce-prod"
}

resource "cloudflare_record" "erp" {
  zone_id = var.zone_id
  name    = "erp"
  type    = "A"
  content = var.odoo_droplet_ip
  ttl     = 300
  proxied = false  # Direct connection for Odoo
  comment = "Odoo ERP - DO droplet odoo-erp-prod"
}

variable "plane_droplet_ip" {
  type        = string
  default     = "68.183.179.64"
  description = "IP address of plane-ce-prod droplet"
}

variable "odoo_droplet_ip" {
  type        = string
  default     = "178.128.112.214"
  description = "IP address of odoo-erp-prod droplet"
}

# =============================================================================
# Outputs
# =============================================================================

output "dns_records" {
  value = {
    www   = cloudflare_record.www.hostname
    app   = cloudflare_record.app.hostname
    plane = cloudflare_record.plane.hostname
    erp   = cloudflare_record.erp.hostname
  }
  description = "Configured DNS records"
}

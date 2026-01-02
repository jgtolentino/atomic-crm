import { useState } from "react";
import { Form, required, useLogin, useNotify } from "ra-core";
import type { SubmitHandler, FieldValues } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/admin/text-input";
import { Notification } from "@/components/admin/notification";
import { useConfigurationContext } from "@/components/atomic-crm/root/ConfigurationContext.tsx";

/**
 * Login page displayed when authentication is enabled and the user is not authenticated.
 *
 * Automatically shown when an unauthenticated user tries to access a protected route.
 * Handles login via authProvider.login() and displays error notifications on failure.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/loginpage LoginPage documentation}
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/security Security documentation}
 */
export const LoginPage = (props: { redirectTo?: string }) => {
  const { darkModeLogo, title } = useConfigurationContext();
  const { redirectTo } = props;
  const [loading, setLoading] = useState(false);
  const login = useLogin();
  const notify = useNotify();
  const navigate = useNavigate();

  const handleSubmit: SubmitHandler<FieldValues> = (values) => {
    setLoading(true);
    login(values, redirectTo)
      .then(() => {
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        notify(
          typeof error === "string"
            ? error
            : typeof error === "undefined" || !error.message
              ? "ra.auth.sign_in_error"
              : error.message,
          {
            type: "error",
            messageArgs: {
              _:
                typeof error === "string"
                  ? error
                  : error && error.message
                    ? error.message
                    : undefined,
            },
          },
        );
      });
  };

  return (
    <div className="min-h-screen flex">
      <div className="container relative grid flex-col items-center justify-center sm:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <img className="h-6 mr-2" src={darkModeLogo} alt={title} />
            {title}
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            </div>
            <Form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <TextInput
                  label="Email"
                  source="email"
                  type="email"
                  validate={required()}
                />
              </div>
              <div className="space-y-2">
                <TextInput
                  label="Password"
                  source="password"
                  type="password"
                  validate={required()}
                />
              </div>
              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={loading}
              >
                Sign in
              </Button>
            </Form>

            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-center hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              Forgot your password?
            </button>

            <div className="mt-4 text-sm text-center">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/sign-up")}
                className="underline cursor-pointer bg-transparent border-none p-0"
              >
                Create account
              </button>
            </div>
          </div>
        </div>
      </div>
      <Notification />
    </div>
  );
};

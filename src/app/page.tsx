import Link from "next/link";
import { getServerSession } from "next-auth";
import { options } from "../app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";

export default async function Home() {
  // Get the real session data
  const session = await getServerSession(options);

  // If the user is authenticated, redirect to the tickets page
  if (session) {
    redirect("/tickets");
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            GIS Ticket Management System
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            A modern application for managing support tickets
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Welcome to the Ticket Management System
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Please log in to access the ticket management system.</p>
              </div>
              <div className="mt-5 flex space-x-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                About GIS Ticket Management
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Our ticket management system helps you track and resolve
                  support issues efficiently. With features like ticket
                  assignment, priority levels, and status tracking, you can
                  ensure that no customer request falls through the cracks..
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

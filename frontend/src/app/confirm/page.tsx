'use client';
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmSignUp } from "@/lib/authService";


const ConfirmForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [confirmationCode, setConfirmationCode] = useState("");

    useEffect(() => {
        const urlEmail = searchParams.get('email');
        if (urlEmail) {
            setEmail(urlEmail);
        } else {
            const storedEmail = sessionStorage.getItem('tempEmail');
            if (storedEmail) {
                setEmail(storedEmail);
                sessionStorage.removeItem('tempEmail');
            }
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await confirmSignUp(email, confirmationCode);
            alert("Account confirmed successfully!\nSign in on next page.");
            router.push("/login");
        } catch (error) {
            alert(`Failed to confirm account: ${error}`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Confirm Your Account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={confirmationCode}
                                onChange={(e) => setConfirmationCode(e.target.value)}
                                placeholder="Confirmation Code"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Confirm Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Loading = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
    </div>
);

const ConfirmUserPage = () => {
    return (
        <Suspense fallback={<Loading />}>
            <ConfirmForm />
        </Suspense>
    );
};

export default ConfirmUserPage;
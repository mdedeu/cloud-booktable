'use client'
import { useState } from "react";
import { signIn, signUp } from "@/lib/authService";
import { useRouter } from "next/navigation";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [userType, setUserType] = useState("CLIENT");
    const [isSignUp, setIsSignUp] = useState(false);
    const navigate = useRouter();

    const handleSignIn = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        try {
            const session = await signIn(email, password);
            console.log("Sign in successful", session);
            if (session && typeof session.AccessToken !== "undefined") {
                sessionStorage.setItem("accessToken", session.AccessToken);
                if (sessionStorage.getItem("accessToken")) {
                    navigate.push('/');
                } else {
                    console.error("Session token was not set properly.");
                }
            } else {
                console.error("SignIn session or AccessToken is undefined.");
            }
        } catch (error) {
            alert(`Sign in failed: ${error}`);
        }
    };

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        try {
            await signUp(email, password, userType);
            navigate.push(`/confirm?email=${encodeURIComponent(email)}`);
        } catch (error) {
            alert(`Sign up failed: ${error}`);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="max-w-md mx-auto mt-8">
                <h1 className="text-3xl font-bold mb-2">
                    {isSignUp ? "Booktable: Create Account" : "Booktable: Welcome Back"}
                </h1>
                <h4 className="text-gray-600 mb-8">
                    {isSignUp ? "Sign up to get started" : "Sign in to your account"}
                </h4>

                <form
                    onSubmit={isSignUp ? handleSignUp : handleSignIn}
                    className="space-y-4"
                >
                    <div>
                        <input
                            className="w-full p-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                        />
                    </div>
                    <div>
                        <input
                            className="w-full p-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                        />
                    </div>
                    {isSignUp && (
                        <>
                            <div>
                                <input
                                    className="w-full p-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm Password"
                                    required
                                />
                            </div>
                            <div>
                                <select
                                    className="w-full p-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    id="userType"
                                    value={userType}
                                    onChange={(e) => setUserType(e.target.value)}
                                    required
                                >
                                    <option value="CLIENT">Client</option>
                                    <option value="OWNER">Owner</option>
                                </select>
                            </div>
                        </>
                    )}
                    <button
                        type="submit"
                        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {isSignUp ? "Sign Up" : "Sign In"}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full mt-4 p-2 text-blue-600 rounded"
                >
                    {isSignUp
                        ? "Already have an account? Sign In"
                        : "Need an account? Sign Up"}
                </button>
            </div>
        </div>
    );
};

export default LoginPage;
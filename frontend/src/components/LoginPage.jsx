import { useState } from "react";
import { loginUser, registerUser } from "../api/api";

export default function LoginPage({ onLogin }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [registered, setRegistered] = useState(false);
	const [error, setError] = useState("");

	async function handleClick() {
		try {
			if (!registered) {
				await registerUser(email, password);
			}
			const res = await loginUser(email, password);
			onLogin(res.access_token);
		} catch (err) {
			setError(err.message);
		}
	}

	return (
		<div className="login-page">
			<div className="login-card">
				<div className="login-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
						<path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
						<line x1="10" y1="22" x2="14" y2="22" />
						<line x1="12" y1="19" x2="12" y2="22" />
					</svg>
				</div>
				<h2 className="login-title">{registered ? "Welcome back" : "Create account"}</h2>
				<p className="login-subtitle">
					{registered ? "Sign in to continue to AI Assistant" : "Get started with AI Assistant"}
				</p>
				{error && <div className="login-error">{error}</div>}
				<input
					className="login-input"
					type="email"
					value={email}
					placeholder="Email address"
					onChange={(e) => setEmail(e.target.value)}
				/>
				<input
					className="login-input"
					type="password"
					value={password}
					placeholder="Password"
					onChange={(e) => setPassword(e.target.value)}
				/>
				<button className="login-btn" onClick={handleClick}>
					{registered ? "Sign in" : "Create account"}
				</button>
				<p className="login-toggle" onClick={() => setRegistered(!registered)}>
					{registered
						? "Don't have an account? Register"
						: "Already have an account? Sign in"}
				</p>
			</div>
		</div>
	);
}

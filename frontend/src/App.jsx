import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MainChat from "./components/MainChat";
import InputBox from "./components/InputBox";
import LoginPage from "./components/LoginPage";
import { useEffect, useState, useCallback } from "react";
import { getThreads, getThreadMessages } from "./api/api";

export default function App() {
	const [threadId, setThreadId] = useState("");
	const [messages, setMessages] = useState([]);
	const [message, setMessage] = useState("");
	const [threadList, setThreadList] = useState([]);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [token, setToken] = useState(localStorage.getItem("token"));

	function handleLogin(newToken) {
		localStorage.setItem("token", newToken);
		setToken(newToken);
	}

	function handleLogout() {
		localStorage.removeItem("token");
		setToken(null);
		setThreadList([]);
		setMessages([]);
		setMessage("");
		setThreadId("");
	}

	const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
	const closeSidebar = useCallback(() => setSidebarOpen(false), []);

	useEffect(() => {
		if (!token) return;

		async function getAllThreads() {
			const res = await getThreads();

			//list of threads
			const threads = res.threads;

			const threadData = await Promise.all(
				threads.map(async (thread_id) => {
					const messages = await getThreadMessages(thread_id);

					const firstMessage = messages.messages[0]?.content || "New Chat";
					const aiMessage = messages.messages[1]?.content || "";

					return {
						id: thread_id,
						message: firstMessage,
						aiMessage: aiMessage,
					};
				}),
			);

			setThreadList(threadData);
		}

		getAllThreads();
	}, [token]);

	if (!token) {
		return <LoginPage onLogin={handleLogin} />;
	}

	return (
		<div className="app-layout">
			{sidebarOpen && (
				<div className="sidebar-overlay" onClick={closeSidebar} />
			)}
			<Sidebar
				threadList={threadList}
				setThreadId={setThreadId}
				activeId={threadId}
				setMessages={setMessages}
				setThreadList={setThreadList}
				isOpen={sidebarOpen}
				onClose={closeSidebar}
			/>
			<div className="app-main">
				<Navbar onToggleSidebar={toggleSidebar} handleLogout={handleLogout} />
				<MainChat
					activeId={threadId}
					messages={messages}
					setMessages={setMessages}
					isLoading={isLoading}
				/>
				<InputBox
					message={message}
					setMessage={setMessage}
					activeId={threadId}
					setThreadId={setThreadId}
					messages={messages}
					setMessages={setMessages}
					setThreadList={setThreadList}
					isLoading={isLoading}
					setIsLoading={setIsLoading}
				/>
			</div>
		</div>
	);
}

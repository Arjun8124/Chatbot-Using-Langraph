import axios from "axios";

const api = axios.create({
	baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export async function sendMessage(message, thread_id) {
	const res = await api.post("/api/chat", {
		message: message,
		thread_id: thread_id,
	});

	return res.data;
}

export async function createThread() {
	const res = await api.post("/api/threads");
	return res.data;
}

export async function getThreads() {
	const res = await api.get("/api/threads");
	return res.data;
}

export async function getThreadMessages(thread_id) {
	const res = await api.get(`/api/threads/${thread_id}/messages`);
	return res.data;
}

export async function uploadPdf(file, thread_id) {
	const formdata = new FormData();
	formdata.append("file", file);
	formdata.append("thread_id", thread_id);

	const res = await api.post("/api/upload_pdf", formdata);

	return res.data;
}

export async function deleteThread(thread_id) {
	const res = await api.delete(`/api/threads/${thread_id}`);
	return res.data;
}

export async function registerUser(email, password) {
	const res = await api.post("/users/register", {
		email: email,
		password: password,
	});
	return res.data;
}

export async function loginUser(email, password) {
	const params = new URLSearchParams();
	params.append("username", email);
	params.append("password", password);

	const res = await api.post("/users/login", params);
	localStorage.setItem("token", res.data.access_token);
	return res.data;
}

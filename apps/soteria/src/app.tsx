import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { LandingPage } from "~/pages/landing/index";
import { ProfilePage } from "~/pages/profile/index";
import { RegisterPage } from "~/pages/register/index";
import { InfoPage } from "~/pages/register/info";
import { SkillsPage } from "~/pages/register/skills";
import { VerifyPage } from "~/pages/register/verify";

export const App = () => (
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<LandingPage />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route path="/register/verify" element={<VerifyPage />} />
			<Route path="/register/info" element={<InfoPage />} />
			<Route path="/register/skills" element={<SkillsPage />} />
			<Route path="/profile" element={<ProfilePage />} />
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	</BrowserRouter>
);

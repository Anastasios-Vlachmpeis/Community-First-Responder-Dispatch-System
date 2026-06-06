import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { TrustBadgeDevPage } from "~/pages/dev/trust-badge";
import { ProfilePage } from "~/pages/profile/index";
import { VerifyPage } from "~/pages/profile/verify";
import { RegisterPage } from "~/pages/register/index";
import { SkillsPage } from "~/pages/register/skills";

export const App = () => (
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<Navigate to="/register" replace />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route path="/register/skills" element={<SkillsPage />} />
			<Route path="/profile" element={<ProfilePage />} />
			<Route path="/profile/verify" element={<VerifyPage />} />
			<Route path="/dev/trust-badge" element={<TrustBadgeDevPage />} />
			<Route path="*" element={<Navigate to="/register" replace />} />
		</Routes>
	</BrowserRouter>
);

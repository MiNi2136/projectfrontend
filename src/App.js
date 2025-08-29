import { RouterProvider, createBrowserRouter } from "react-router-dom";
import {
  TeacherDashboard,
  HomeLayout,
  Landing,
  Login,
  Logout,
  Register,
  Nav,
  NewSession,
  StudentDashboard,
  ForgotPassword,
  UserDetails,
} from "./pages/Index";
import Reports from "./pages/Reports";
import TeacherReports from "./pages/TeacherReports";
import TeacherDataSheetReports from "./pages/TeacherDataSheetReports";
import Performance from "./pages/Performance";
import Settings from "./pages/Settings";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "teacher-dashboard",
        element: <TeacherDashboard />,
      },
      {
        path: "student-dashboard",
        element: <StudentDashboard />,
      },
      {
        path: "logout",
        element: <Logout />,
      },
      {
        path: "create-session",
        element: <NewSession />,
      },
      {
        path: "profile",
        element: <UserDetails />,
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "teacher-reports", 
        element: <TeacherReports />,
      },
      {
        path: "teacher-data-reports",
        element: <TeacherDataSheetReports />,
      },
      {
        path: "performance",
        element: <Performance />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "*",
        element: <h1>404 Not Found</h1>,
      },
    ],
  },
]);

function App() {
  return (
    <div>
      <Nav />
      <RouterProvider router={router} />
    </div>
  );
}

export default App;

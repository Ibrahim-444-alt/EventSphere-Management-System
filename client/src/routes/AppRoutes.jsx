import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Home from "../pages/public/Home";
import About from "../pages/public/About";
import Events from "../pages/public/Events";
import EventDetails from "../pages/public/EventDetails";
import Contact from "../pages/public/Contact";
import ForgotPassword from "../pages/public/ForgotPassword";
import NotFound from "../pages/public/NotFound";
import Login from "../pages/public/Login";
import Register from "../pages/public/Register";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "../components/ProtectedRoute";

import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/Dashboard";
import ExpoManagement from "../pages/admin/ExpoManagement";
import CreateExpo from "../pages/admin/CreateExpo";
import EditExpo from "../pages/admin/EditExpo";
import ExhibitorManagement from "../pages/admin/ExhibitorManagement";
import BoothManagement from "../pages/admin/BoothManagement";
import FloorPlan from "../pages/admin/FloorPlan";
import SpeakerManagement from "../pages/admin/SpeakerManagement";
import ScheduleManagement from "../pages/admin/ScheduleManagement";
import AttendeeManagement from "../pages/admin/AttendeeManagement";
import FeedbackManagement from "../pages/admin/FeedbackManagement";
import Inquiries from "../pages/admin/Inquiries";
import Analytics from "../pages/admin/Analytics";
import Reports from "../pages/admin/Reports";
import Profile from "../pages/admin/Profile";
import Settings from "../pages/admin/Settings";

import ExhibitorLayout from "../layouts/ExhibitorLayout";
import ExhibitorDashboard from "../pages/exhibitor/Dashboard";
import RegisterExpo from "../pages/exhibitor/RegisterExpo";
import ExhibitorProfile from "../pages/exhibitor/Profile";
import MyBooth from "../pages/exhibitor/MyBooth";

import AttendeeLayout from "../layouts/AttendeeLayout";
import AttendeeDashboard from "../pages/attendee/Dashboard";
import BrowseEvents from "../pages/attendee/BrowseEvents";
import MyRegistrations from "../pages/attendee/MyRegistrations";
import AttendeeSessions from "../pages/attendee/Sessions";
import Bookmarks from "../pages/attendee/Bookmarks";
import AttendeeFeedback from "../pages/attendee/Feedback";
import AttendeeProfile from "../pages/attendee/Profile";


function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<ExpoManagement />} />
            <Route path="/admin/events/create" element={<CreateExpo />} />
            <Route path="/admin/events/edit/:id" element={<EditExpo />} />
            <Route path="/admin/exhibitors" element={<ExhibitorManagement />} />
            <Route path="/admin/booths" element={<BoothManagement />} />
            <Route path="/admin/floor-plan" element={<FloorPlan />} />
            <Route path="/admin/speakers" element={<SpeakerManagement />} />
            <Route path="/admin/sessions" element={<ScheduleManagement />} />
            <Route path="/admin/attendees" element={<AttendeeManagement />} />
            <Route path="/admin/feedback" element={<FeedbackManagement />} />
            <Route path="/admin/inquiries" element={<Inquiries />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/admin/settings" element={<Settings />} />

          </Route>
        </Route>

          <Route element={<ProtectedRoute allowedRoles={["exhibitor"]} />}>
          <Route element={<ExhibitorLayout />}>
            <Route path="/exhibitor" element={<ExhibitorDashboard />} />
            <Route path="/exhibitor/register-expo" element={<RegisterExpo />} />
            <Route path="/exhibitor/profile" element={<ExhibitorProfile />} />
            <Route path="/exhibitor/my-booth" element={<MyBooth />} />
          </Route>

        </Route>

            <Route element={<ProtectedRoute allowedRoles={["attendee"]} />}>
            <Route element={<AttendeeLayout />}>
              <Route path="/attendee" element={<AttendeeDashboard />} />
              <Route path="/attendee/expos" element={<BrowseEvents />} />
              <Route path="/attendee/registrations" element={<MyRegistrations />} />
              <Route path="/attendee/sessions" element={<AttendeeSessions />} />
              <Route path="/attendee/bookmarks" element={<Bookmarks />} />
              <Route path="/attendee/feedback" element={<AttendeeFeedback />} />
              <Route path="/attendee/profile" element={<AttendeeProfile />} />
            </Route>
          </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
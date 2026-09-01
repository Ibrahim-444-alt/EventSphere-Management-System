import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EventForm from "../../components/admin/EventForm";
import { createEvent } from "../../services/eventService";

const EMPTY_EVENT = {
  title: "", description: "", date: "", startTime: "", endTime: "",
  location: "", theme: "", status: "Draft", registrationDeadline: "", image: "",
};

function CreateExpo() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await createEvent(formData);
      navigate("/admin/events");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="expo-form-page">
      <div className="admin-page-header">
        <h1>Create Event</h1>
        <p>Fill in the details below to add a new event.</p>
      </div>
      <div className="admin-panel">
        <EventForm initialValues={EMPTY_EVENT} onSubmit={handleSubmit} submitLabel="Create Event" isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}

export default CreateExpo;
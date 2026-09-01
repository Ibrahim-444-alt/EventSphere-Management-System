import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EventForm from "../../components/admin/EventForm";
import { getEvent, updateEvent } from "../../services/eventService";

function EditExpo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getEvent(id)
      .then((event) => {
        setInitialValues({
          title: event.title || "",
          description: event.description || "",
          date: event.date ? event.date.slice(0, 10) : "",
          startTime: event.startTime || "",
          endTime: event.endTime || "",
          location: event.location || "",
          theme: event.theme || "",
          status: event.status || "Draft",
          registrationDeadline: event.registrationDeadline ? event.registrationDeadline.slice(0, 10) : "",
          image: event.image || "",
        });
      })
      .catch(() => setLoadError("Failed to load this event."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await updateEvent(id, formData);
      navigate("/admin/events");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="expo-form-page">
      <div className="admin-page-header">
        <h1>Edit Event</h1>
        <p>Update the details for this event.</p>
      </div>

      {isLoading ? (
        <p className="admin-state-text">Loading event...</p>
      ) : loadError ? (
        <p className="admin-state-text admin-state-error">{loadError}</p>
      ) : (
        <div className="admin-panel">
          <EventForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Save Changes" isSubmitting={isSubmitting} />
        </div>
      )}
    </div>
  );
}

export default EditExpo;
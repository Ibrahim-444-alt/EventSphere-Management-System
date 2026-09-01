import { Link } from "react-router-dom";
import "./Button.css";

function Button({ to, variant = "primary", type = "button", onClick, disabled = false, children }) {
  const className = variant === "outline" ? "btn btn-outline" : "btn btn-primary";

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export default Button;
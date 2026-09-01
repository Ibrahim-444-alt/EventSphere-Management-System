import "./StarRating.css";

// Sirf dikhane ke liye hai — is par click nahi hota. Rating dene ka input
// attendee portal ke form mein hai aur wo bilkul alag cheez hai.
function StarRating({ value, label }) {
  // 4.6 jaisi auslat ke liye sitare gol karne parte hain, aur gol karna thora
  // sa jhoot hai. Isi liye page par asli adad (4.6) sitaron ke saath likha
  // jata hai: sitare andaza dete hain, adad sach batata hai.
  const rounded = Math.round(value);

  return (
    <span className="star-rating" role="img" aria-label={label || `${value} out of 5 stars`}>
      {/* Har sitare par aria-hidden zaroori hai, warna screen reader
          "star star star star star" bolta rehta. Poori baat ooper aria-label
          mein ek hi dafa keh di gayi hai. */}
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? "star star-on" : "star star-off"} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

export default StarRating;
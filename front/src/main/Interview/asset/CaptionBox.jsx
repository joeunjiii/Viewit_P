function CaptionBox({ text, enabled }) {
  return (
    <div
      className="caption-box"
      style={{ visibility: enabled ? "visible" : "hidden" }}
    >
      <p>{text}</p>
    </div>
  );
}
export default CaptionBox;

export default function PageHeading({ eyebrow, title, description, children }) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-heading-description">{description}</p>}
      </div>
      {children && <div className="page-heading-actions">{children}</div>}
    </header>
  );
}

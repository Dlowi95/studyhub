import { getFileTypeKey } from "@/lib/fileTypes";

export default function FileTypeIcon({ format, className = "" }) {
  const key = getFileTypeKey(format);
  const label = String(format || "Tệp").toUpperCase();
  return <img className={className} src={`/images/file-formats/${key}.svg`} alt="" aria-hidden="true" draggable="false" data-file-format={label} />;
}

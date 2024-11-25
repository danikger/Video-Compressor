export default function ProgressBar({ progress }) {
  return (
    <div className="radial-progress text-zinc-200" style={{ "--value": progress }} role="progressbar">
      {progress.toFixed(0)}%
    </div>
  );
}
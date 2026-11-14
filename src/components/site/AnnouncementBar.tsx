export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="bg-gradient-to-r from-blush-400 via-lavender-400 to-blush-400 py-2 text-center text-xs font-semibold text-white sm:text-sm">
      <div className="container-x">{text}</div>
    </div>
  );
}

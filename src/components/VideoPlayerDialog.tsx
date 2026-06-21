import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { publicUrl } from "@/lib/media";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  videoType: "youtube" | "upload" | "none";
  youtubeId?: string | null;
  videoUrl?: string | null;
};

export default function VideoPlayerDialog({ open, onOpenChange, title, videoType, youtubeId, videoUrl }: Props) {
  const src = videoType === "upload" ? publicUrl("exercise-videos", videoUrl) : null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-ink border-ink">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="aspect-video bg-black">
          {videoType === "youtube" && youtubeId && (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          {videoType === "upload" && src && (
            <video src={src} controls autoPlay className="w-full h-full" />
          )}
          {videoType === "none" && (
            <div className="w-full h-full flex items-center justify-center text-white/60">Sin video disponible</div>
          )}
        </div>
        <div className="p-4 text-white text-display font-bold uppercase tracking-wider">{title}</div>
      </DialogContent>
    </Dialog>
  );
}

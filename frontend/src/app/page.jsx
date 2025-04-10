import Algorithm from "../components/algorithm";
import ImageProc from "../components/imageProc";
import VideoAnalyze from "@/components/videoAnalyze";

export default function Home() {
  return (
    <div className="py-[100px] flex flex-col w-full gap-10">
      <Algorithm />
      <ImageProc />
      <VideoAnalyze />
    </div>
  );
}

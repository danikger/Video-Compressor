import { useState, useRef, useEffect } from 'react';
import { ReactCompareSlider } from 'react-compare-slider';
import { BsPauseFill, BsFillPlayFill } from "react-icons/bs";

export default function VideoPlayer({ originalVidSrc, compressedVidSrc }) {
  const [sliderValue, setSliderValue] = useState(0); // Slider value in seconds
  const [duration, setDuration] = useState(0); // Duration of the video

  const [isPlaying, setIsPlaying] = useState(true);

  const originalVideoRef = useRef(null);
  const compressedVideoRef = useRef(null);


  /**
   * Sets the duration of the video when the metadata is loaded.
   */
  function handleLoadedMetadata() {
    if (originalVideoRef.current) {
      setDuration(originalVideoRef.current.duration);
    }
  };


  /**
   * Updates the slider value when the video is playing.
   */
  function handleTimeUpdate() {
    if (originalVideoRef.current) {
      setSliderValue(originalVideoRef.current.currentTime);
    }
  };


  /**
   * Updates the video playback time when the slider is changed.
   * 
   * @param {Event} e - Event object 
   */
  function handleSliderChange(e) {
    const newTime = parseFloat(e.target.value);
    setSliderValue(newTime);

    // Update both videos to the same playback time
    if (originalVideoRef.current) originalVideoRef.current.currentTime = newTime;
    if (compressedVideoRef.current) compressedVideoRef.current.currentTime = newTime;
  };


  useEffect(() => {
    // Add event listeners
    const originalVideo = originalVideoRef.current;
    const compressedVideo = compressedVideoRef.current;

    if (originalVideo && compressedVideo) {
      originalVideo.addEventListener("loadedmetadata", handleLoadedMetadata);
      originalVideo.addEventListener("timeupdate", handleTimeUpdate);
    }

    return () => {
      // Cleanup event listeners
      if (originalVideo && compressedVideo) {
        originalVideo.removeEventListener("loadedmetadata", handleLoadedMetadata);
        originalVideo.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };
  }, []);


  /**
   * Pauses or plays the video when the play/pause button is clicked.
   */
  function handlePausePlay() {
    if (originalVideoRef.current.paused) {
      originalVideoRef.current.play();
      compressedVideoRef.current.play();
      setIsPlaying(true);
    } else {
      originalVideoRef.current.pause();
      compressedVideoRef.current.pause();
      setIsPlaying(false);
    }
  }


  return (
    <>
      <ReactCompareSlider
        itemOne={
          <video autoPlay muted ref={originalVideoRef} playsInline className="rounded-t-xl size-full">
            <source src={originalVidSrc} type="video/mp4" />
          </video>
        }
        itemTwo={
          <video autoPlay muted ref={compressedVideoRef} playsInline className="rounded-t-xl size-full">
            <source src={compressedVidSrc} type="video/mp4" />
          </video>
        }
      />

      <div className="flex items-center bg-zinc-800 rounded-b-xl px-3 py-2">
        <button onClick={() => handlePausePlay()} className="group mr-2">
          {isPlaying ? <BsPauseFill className="text-zinc-200 size-6 group-hover:text-zinc-50" /> : <BsFillPlayFill className="text-zinc-200 size-6 group-hover:text-zinc-50" />}
        </button>
        <input
          id="video-slider"
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={sliderValue}
          onChange={(e) => handleSliderChange(e)} className="w-full h-1.5 bg-zinc-800 rounded-lg cursor-pointer accent-zinc-200 "
        />
      </div>
    </>
  );
}

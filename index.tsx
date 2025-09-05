import React, { useState, useEffect, useCallback } from "react";

interface ImageObject {
  name: string;
  isCampus: boolean;
}

interface TimeLimits {
  [key: number]: number;
}

const CampusVerificationSystem: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentImages, setCurrentImages] = useState<ImageObject[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalMessage, setModalMessage] = useState<string>("");
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  const pointsPerCorrect = 5;
  const timeLimits: TimeLimits = { 1: 30, 2: 60, 3: 120 };

  // Mock image data - in a real app, these would be fetched from your server
  const allCampusImages = [
    "campus1.jpg",
    "campus2.jpg",
    "campus3.jpg",
    "campus4.jpg",
    "campus5.jpg",
    "campus6.jpg",
    "campus7.jpg",
    "campus8.jpg",
    "campus9.jpg",
    "campus10.jpg",
  ];

  const allExternalImages = [
    "external1.jpg",
    "external2.jpg",
    "external3.jpg",
    "external4.jpg",
    "external5.jpg",
    "external6.jpg",
    "external7.jpg",
    "external8.jpg",
    "external9.jpg",
    "external10.jpg",
    "external11.jpg",
    "external12.jpg",
    "external13.jpg",
    "external14.jpg",
    "external15.jpg",
    "external16.jpg",
  ];

  const getRandomImages = (array: string[], count: number): string[] => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadLevel = useCallback(() => {
    setSelectedImages([]);

    let campusCount: number, externalCount: number;
    if (currentLevel === 1) {
      campusCount = 1;
      externalCount = 3;
    } else if (currentLevel === 2) {
      campusCount = 3;
      externalCount = 6;
    } else {
      campusCount = 6;
      externalCount = 10;
    }

    const campusImages = getRandomImages(allCampusImages, campusCount);
    const externalImages = getRandomImages(allExternalImages, externalCount);
    const images: ImageObject[] = [
      ...campusImages.map((i) => ({ name: i, isCampus: true })),
      ...externalImages.map((i) => ({ name: i, isCampus: false })),
    ];

    setCurrentImages(shuffleArray(images));
    setTimeRemaining(timeLimits[currentLevel]);
  }, [currentLevel]);

  const startTimer = useCallback(() => {
    if (timerId) {
      clearTimeout(timerId);
    }

    const timer = setTimeout(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          showModalDialog(
            "Time Expired",
            `Level ${currentLevel} failed. Score: ${totalPoints}`,
            () => resetVerification()
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerId(timer);
  }, [currentLevel, totalPoints, timerId]);

  const stopTimer = useCallback(() => {
    if (timerId) {
      clearTimeout(timerId);
      setTimerId(null);
    }
  }, [timerId]);

  useEffect(() => {
    if (timeRemaining > 0) {
      startTimer();
    } else if (timeRemaining === 0 && currentImages.length > 0) {
      stopTimer();
    }

    return () => stopTimer();
  }, [timeRemaining, startTimer, stopTimer, currentImages.length]);

  useEffect(() => {
    loadLevel();
  }, [loadLevel]);

  const toggleSelection = (index: number) => {
    setSelectedImages((prev) => {
      if (currentLevel === 1) {
        return prev.includes(index) ? [] : [index];
      } else {
        return prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index];
      }
    });
  };

  const validateSelection = () => {
    stopTimer();

    let correctSelections = 0;
    let incorrectIndices: number[] = [];

    selectedImages.forEach((index) => {
      const isCampus = currentImages[index]?.isCampus;
      if (isCampus) {
        correctSelections++;
      } else {
        incorrectIndices.push(index);
      }
    });

    const required = currentLevel === 1 ? 1 : currentLevel === 2 ? 3 : 6;
    const levelPoints = correctSelections * pointsPerCorrect;
    setTotalPoints((prev) => prev + levelPoints);

    if (correctSelections === required && incorrectIndices.length === 0) {
      if (currentLevel < 3) {
        showModalDialog(
          "Success!",
          `Level ${currentLevel} complete. Points: ${levelPoints}`,
          () => {
            setCurrentLevel((prev) => prev + 1);
          }
        );
      } else {
        showModalDialog(
          "Verification Complete!",
          `Final score: ${totalPoints + levelPoints}`,
          () => resetVerification()
        );
      }
    } else {
      showModalDialog(
        "Verification Failed",
        `Incorrect. Score: ${totalPoints + levelPoints}`,
        () => resetVerification()
      );
    }
  };

  const resetVerification = () => {
    setCurrentLevel(1);
    setTotalPoints(0);
    setSelectedImages([]);
    stopTimer();
  };

  const showModalDialog = (
    title: string,
    message: string,
    callback?: () => void
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalCallback(() => callback || null);
    setShowModal(true);
  };

  const hideModal = () => {
    setShowModal(false);
    if (modalCallback) {
      modalCallback();
      setModalCallback(null);
    }
  };

  const getGridClass = () => {
    if (currentLevel === 1) return "grid-cols-2";
    if (currentLevel === 2) return "grid-cols-3";
    return "grid-cols-4";
  };

  const getInstructions = () => {
    if (currentLevel === 1) return "LEVEL 1: Select the ONE campus image.";
    if (currentLevel === 2) return "LEVEL 2: Select all 3 campus images.";
    return "LEVEL 3: Select all 6 campus images.";
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isWarningTime = () => {
    const limit = timeLimits[currentLevel];
    return timeRemaining < limit * 0.2;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-5">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-5">
        <div className="text-center text-2xl font-bold text-gray-800 mb-5 pb-2 border-b-2 border-blue-500">
          Campus Verification System
        </div>

        <div className="flex justify-between items-center mb-5 p-3 bg-gray-50 rounded">
          <div className="text-lg font-bold text-blue-600">
            Total Points: {totalPoints}
          </div>
          <div
            className={`text-lg font-bold ${
              isWarningTime()
                ? "text-red-600 animate-pulse"
                : "text-red-500"
            }`}
          >
            Time: {formatTime(timeRemaining)}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400 mb-5">
          <div className="text-sm leading-6">{getInstructions()}</div>
        </div>

        <div className={`grid gap-3 justify-center mb-8 ${getGridClass()}`}>
          {currentImages.map((imgObj, index) => (
            <div
              key={index}
              className={`
                border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 
                bg-gray-50 flex items-center justify-center aspect-square
                hover:border-blue-500 hover:scale-105
                ${
                  selectedImages.includes(index)
                    ? "border-blue-500 border-4 shadow-lg shadow-blue-500/50"
                    : "border-gray-300"
                }
                ${
                  currentLevel === 1
                    ? "w-48 h-48"
                    : currentLevel === 2
                    ? "w-36 h-36"
                    : "w-28 h-28"
                }
              `}
              onClick={() => toggleSelection(index)}
            >
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-gray-600 font-medium">
                {imgObj.isCampus ? "🏫" : "🌆"} Image {index + 1}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-5 mb-8">
          <button
            className={`
              px-6 py-3 text-sm font-bold border-none rounded cursor-pointer transition-all duration-300 uppercase
              ${
                selectedImages.length === 0
                  ? "bg-gray-400 text-white cursor-not-allowed opacity-60"
                  : "bg-green-500 text-white hover:bg-green-600 hover:-translate-y-0.5"
              }
            `}
            onClick={validateSelection}
            disabled={selectedImages.length === 0}
          >
            Submit Selection
          </button>
          <button
            className="px-6 py-3 text-sm font-bold border-none rounded cursor-pointer transition-all duration-300 uppercase bg-gray-600 text-white hover:bg-gray-700"
            onClick={resetVerification}
          >
            Reset Game
          </button>
        </div>

        <div className="bg-gray-200 px-4 py-2 text-xs text-gray-600 rounded-b-lg -mx-5 -mb-5 mt-5">
          Level {currentLevel} of 3
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center max-w-md w-11/12 mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {modalTitle}
            </h3>
            <p className="mb-5 leading-6 text-gray-600">{modalMessage}</p>
            <button
              className="px-6 py-3 text-sm font-bold border-none rounded cursor-pointer transition-all duration-300 uppercase bg-blue-500 text-white hover:bg-blue-600"
              onClick={hideModal}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusVerificationSystem;

export const BookLoaderComponent = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="text-blue-400 text-lg font-medium animate-pulse">
        Processing your preferences...
      </div>
    </div>
  );
};
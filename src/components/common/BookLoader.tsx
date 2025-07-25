import { BookLoader } from "react-awesome-loaders";
export const BookLoaderComponent = () => {
  return (
    <>
      <BookLoader
        background={"linear-gradient(135deg, #6066FA, #4645F6)"}
        desktopSize={"100px"}
        mobileSize={"80px"}
        textColor={"#FFF"}
        text={"Processing your preferences..."}
      />
    </>
  );
};
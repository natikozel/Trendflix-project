declare module 'react-awesome-loaders' {
    export interface BookLoaderProps {
      background?: string;
      desktopSize?: string;
      mobileSize?: string;
      textColor?: string;
      text?: string;
    }
    
    export const BookLoader: React.FC<BookLoaderProps>;
  }
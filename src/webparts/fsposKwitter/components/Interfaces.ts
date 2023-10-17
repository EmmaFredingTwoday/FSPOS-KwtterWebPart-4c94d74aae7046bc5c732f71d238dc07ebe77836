// create File item to work with it internally
export interface IKwitterItem {
    Id: number;
    Title: string;
    atTag: string;
    content: string;
    logo: string;
    Created: Date;
    likes: number;
  }

  // create File item to work with it internally with images
export interface IImageFile{
  Id: number;
  LinkJson: JSON;
}
  
  // create PnP JS response interface for File
  export interface IResponseFile {
    Length: number;
  }
  
  // create PnP JS response interface for Item
  export interface IResponseItem {
    Id: number;
    Title: string;    
    atTag: string;
    content: string;
    logo: string;
    Created: Date;
    likes: number;
  }

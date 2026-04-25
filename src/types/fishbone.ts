export interface Cause {
  id: string;
  text: string;
  subCauses?: Cause[];
}

export interface Category {
  id: string;
  name: string;
  causes: Cause[];
}

export interface FishboneData {
  title: string;
  categories: Category[];
}

// multiDocuments is object with key-values where keys are string and values are the documents
export const validate = (multiDocuments: any): boolean => {
    if (multiDocuments && Object.keys(multiDocuments).length > 0) {
        return Object.keys(multiDocuments).every((key) => {
           return typeof key === "string" && key && key.trim() && typeof multiDocuments[key] === "object";
        });
     }
    return false;

};

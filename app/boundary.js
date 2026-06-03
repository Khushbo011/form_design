import { jsx } from "react/jsx-runtime";

export const boundary = {
  error(error) {
    if (
      error &&
      (error.constructor.name === "ErrorResponse" ||
        error.constructor.name === "ErrorResponseImpl")
    ) {
      return jsx("div", {
        dangerouslySetInnerHTML: { __html: error.data || "Handling response" },
      });
    }
    throw error;
  },

  headers(headers) {
    const { parentHeaders, loaderHeaders, actionHeaders, errorHeaders } = headers;
    if (errorHeaders && Array.from(errorHeaders.entries()).length > 0) {
      return errorHeaders;
    }
    return new Headers([
      ...(parentHeaders ? Array.from(parentHeaders.entries()) : []),
      ...(loaderHeaders ? Array.from(loaderHeaders.entries()) : []),
      ...(actionHeaders ? Array.from(actionHeaders.entries()) : []),
    ]);
  },
};

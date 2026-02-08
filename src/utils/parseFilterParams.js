const parseBoolean = (value) => {
  if (typeof value !== 'string') return undefined;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return undefined;
};

export const parseFilterParams = (query) => {
  const { contactType, type, isFavourite } = query;

  const parsedContactType =
    typeof contactType === 'string'
      ? contactType
      : typeof type === 'string'
        ? type
        : undefined;

  const parsedIsFavourite = parseBoolean(isFavourite);

  return {
    contactType: parsedContactType,
    isFavourite: parsedIsFavourite,
  };
};

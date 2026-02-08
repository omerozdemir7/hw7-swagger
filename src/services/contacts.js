import { ContactsCollection } from '../db/models/contact.js';
import { calculatePaginationData } from '../utils/calculatePaginationData.js';
import { SORT_ORDER } from '../constants/index.js';

export const getAllContacts = async ({
  userId,
  page = 1,
  perPage = 10,
  sortBy = '_id',
  sortOrder = SORT_ORDER.ASC,
  filter = {},
}) => {
  const query = { userId };

  if (typeof filter.contactType === 'string' && filter.contactType.length > 0) {
    query.contactType = filter.contactType;
  }

  if (typeof filter.isFavourite === 'boolean') {
    query.isFavourite = filter.isFavourite;
  }

  const skip = (page - 1) * perPage;
  const sortDirection = sortOrder === SORT_ORDER.DESC ? -1 : 1;

  const [totalItems, data] = await Promise.all([
    ContactsCollection.countDocuments(query),
    ContactsCollection.find(query)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(perPage),
  ]);

  return {
    data,
    ...calculatePaginationData(totalItems, perPage, page),
  };
};

export const getContactById = async (contactId, userId) => {
  return await ContactsCollection.findOne({ _id: contactId, userId });
};

export const createContact = async (payload) => {
  return await ContactsCollection.create(payload);
};

export const updateContact = async (contactId, userId, payload) => {
  return await ContactsCollection.findOneAndUpdate(
    { _id: contactId, userId },
    payload,
    { new: true },
  );
};

export const deleteContact = async (contactId, userId) => {
  return await ContactsCollection.findOneAndDelete({ _id: contactId, userId });
};

export const createContactsBulk = async (contacts) => {
  return await ContactsCollection.insertMany(contacts);
};

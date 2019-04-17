const moment = require('moment')
const classification = require('../classification.json')

// ====== Constants =======

const defaultMedataOperation = {
  _id: '0',
  _proba: 0,
  _type: 'none'
}

// ====== Public functions =======

/**
 * Convert string to {@link moment.Moment}
 * @param {string} date
 * @returns {moment.Moment}
 */
function parseDate(date) {
  moment.locale('fr')
  return moment(date, 'MM-DD-YYYY')
}

/**
 * Convert an amount to float
 * @param {string} amount
 * @returns {Number}
 */
function normalizeAmount(amount) {
  return parseFloat(amount.replaceAll(/\s|,/, '').trim())
}

/**
 * Analyzes the label of the bank account to find its type
 *
 * @param {string} label The label of the bank account
 * @see {@link https://docs.cozy.io/en/cozy-doctypes/docs/io.cozy.bank/#iocozybankaccounts|io.cozy.bank.accounts}
 * @returns {string} The type of the bank account
 */
function parseLabelBankAccount(label) {
  let parts = label.split(' ')

  switch (parts[0].toUpperCase()) {
    case 'LIVRET':
      return 'Savings'
    case 'COMPTE':
      if (parts[1].toUpperCase() === 'COURANT') {
        return 'Bank'
      }
  }
  return 'UNKNOWN LABEL'
}

/**
 * Searches in the classification.json file, the metadata corresponding to words passed in parameters.
 * This function ignores the metadata dedicated to debit operations.
 *
 * @param {array} words
 * @returns {object}
 */
function findMetadataForCreditOperation(words) {
  return _classification(words, defaultMedataOperation, (tree, metadata) =>
    _readSpecificMetaData(tree, '_credit', metadata)
  )
}

/**
 * Searches in the classification.json file, the metadata corresponding to words passed in parameters.
 * This function ignores the metadata dedicated to credit operations.
 *
 * @param {array} words
 * @returns {object}
 */
function findMetadataForDebitOperation(words) {
  return _classification(words, defaultMedataOperation, (tree, metadata) =>
    _readSpecificMetaData(tree, '_debit', metadata)
  )
}

// ====== Private functions =======

function _classification(words, metadata, fnReadMetadata) {
  let treeActive = classification[words[0].toUpperCase()]
  if (!treeActive) {
    return metadata
  }

  fnReadMetadata(treeActive, metadata)

  for (let word of words.slice(1)) {
    let tree = treeActive[word.toUpperCase()]

    if (!tree) {
      return metadata
    }

    fnReadMetadata(tree, metadata)
    treeActive = tree
  }
}

function _readDefaultMetaData(treeMetadata, metadata) {
  Object.keys(metadata).forEach(key => {
    if (treeMetadata[key]) metadata[key] = treeMetadata[key]
  })
}

function _readSpecificMetaData(treeMetadata, typeOperation, metadata) {
  _readDefaultMetaData(treeMetadata, metadata)

  if (treeMetadata[typeOperation]) {
    _readDefaultMetaData(treeMetadata[typeOperation], metadata)
  }
  return metadata
}

// ====== Export =======

module.exports = {
  parseDate,
  normalizeAmount,
  parseLabelBankAccount,
  findMetadataForCreditOperation,
  findMetadataForDebitOperation
}

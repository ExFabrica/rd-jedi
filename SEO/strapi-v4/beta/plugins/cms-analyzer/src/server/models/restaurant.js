export default {
  collectionName: 'restaurants',
  info: {
    name: 'Restaurant',
  },
  options: {
    timestamps: ['created_at', 'updated_at'],
  },
  pluginOptions: {
    "content-manager": {
      "visible": true
    },
    "content-type-builder": {
      "visible": true
    }
  },
  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    seats: {
      type: 'integer',
    },
  },
};

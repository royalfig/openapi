function extractMethod(res) {

    const {method, url, queryString} = res.log.entries[0].request;

    return method.toLowerCase();

}






const pathTemplate = (input) => {
  const { path, method, tags, summary, params, responses } = input;

  return {
    [path]: {
      [method]: {
        operationId: '',
        tags,
        summary,
        parameters: params,
        responses,
        security: ['api-key'],
      },
    },
  };
};

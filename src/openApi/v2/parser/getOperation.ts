import { Operation } from '../../../client/interfaces/Operation';
import { OperationParameters } from '../../../client/interfaces/OperationParameters';
import { OpenApi } from '../interfaces/OpenApi';
import { OpenApiOperation } from '../interfaces/OpenApiOperation';
import { getComment } from './getComment';
import { getOperationErrors } from './getOperationErrors';
import { getOperationName } from './getOperationName';
import { getOperationParameters } from './getOperationParameters';
import { getOperationPath } from './getOperationPath';
import { getOperationResponseHeader } from './getOperationResponseHeader';
import { getOperationResponses } from './getOperationResponses';
import { getOperationResults } from './getOperationResults';
import { getServiceClassName } from './getServiceClassName';

export function getOperation(openApi: OpenApi, url: string, method: string, op: OpenApiOperation, pathParams: OperationParameters): Operation {
    const serviceName = (op.tags && op.tags[0]) || 'Service';
    const serviceClassName = getServiceClassName(serviceName);
    const operationNameFallback = `${method}${serviceClassName}`;
    const operationName = getOperationName(op.operationId || operationNameFallback);
    const operationPath = getOperationPath(url);

    // Create a new operation object for this method.
    const operation: Operation = {
        service: serviceClassName,
        name: operationName,
        summary: getComment(op.summary),
        description: getComment(op.description),
        deprecated: op.deprecated === true,
        method: method,
        path: operationPath,
        parameters: [...pathParams.parameters],
        parametersPath: [...pathParams.parametersPath],
        parametersQuery: [...pathParams.parametersQuery],
        parametersForm: [...pathParams.parametersForm],
        parametersHeader: [...pathParams.parametersHeader],
        parametersCookie: [...pathParams.parametersCookie],
        parametersBody: pathParams.parametersBody,
        imports: [],
        errors: [],
        results: [],
        responseHeader: null,
    };

    // Parse the operation parameters (path, query, body, etc).
    if (op.parameters) {
        const parameters = getOperationParameters(openApi, op.parameters);
        const newParameterNames = parameters.parameters.map(parameter => parameter.name);

        operation.imports.push(...parameters.imports);
        operation.parameters = [...operation.parameters.filter(parameter => !newParameterNames.includes(parameter.name)), ...parameters.parameters];
        operation.parametersPath = [...operation.parametersPath.filter(parameter => !newParameterNames.includes(parameter.name)), ...parameters.parametersPath];
        operation.parametersQuery = [...operation.parametersQuery.filter(parameter => !newParameterNames.includes(parameter.name)), ...parameters.parametersQuery];
        operation.parametersForm = [...operation.parametersForm.filter(parameter => !newParameterNames.includes(parameter.name)), ...parameters.parametersForm];
        operation.parametersHeader = [...operation.parametersHeader.filter(parameter => !newParameterNames.includes(parameter.name)), ...parameters.parametersHeader];
        operation.parametersCookie = [...operation.parametersCookie.filter(parameter => !newParameterNames.includes(parameter.name)), ...parameters.parametersCookie];
        operation.parametersBody = parameters.parametersBody;
    }

    // Parse the operation responses.
    if (op.responses) {
        const operationResponses = getOperationResponses(openApi, op.responses);
        const operationResults = getOperationResults(operationResponses);
        operation.errors = getOperationErrors(operationResponses);
        operation.responseHeader = getOperationResponseHeader(operationResults);

        operationResults.forEach(operationResult => {
            operation.results.push(operationResult);
            operation.imports.push(...operationResult.imports);
        });
    }

    return operation;
}

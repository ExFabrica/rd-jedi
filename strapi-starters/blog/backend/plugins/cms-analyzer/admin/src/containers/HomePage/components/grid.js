
import React, { memo, useEffect, useState, useReducer } from 'react';
import { Table } from '@buffetjs/core';
import { sortBy as sort } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPencilAlt,
    faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import contentTypesMiddleware from '../../../middlewares/content-types/ui-contentTypes';

const Grid = (props) => {

    const [contentTypes, setContentTypes] = useState();

    useEffect(() => {
        // get contentTypes
        contentTypesMiddleware.get().then((contentTypes) => {
            console.log("contentTypes", contentTypes);
            state.rows = [...contentTypes.map(contentType => {
                return {
                    uid: contentType.uid,
                    collectionName: contentType.collectionName,
                    kind: contentType.kind,
                    createdBy: contentType.loadedModel.created_by.ref,
                    modelName: contentType.modelName
                }
            })];
            setContentTypes(contentTypes);
        });
    }, []);

    // tables
    const headers = [
        {
            name: 'Id',
            value: 'uid',
            isSortEnabled: true,
        },
        {
            name: 'Name',
            value: 'collectionName',
            isSortEnabled: true,
        },
        {
            name: 'Kind',
            value: 'kind',
            isSortEnabled: true,
        },
        {
            name: 'Created By',
            value: 'createdBy',
            isSortEnabled: true,
        },
        {
            name: 'ModelName',
            value: 'modelName',
            isSortEnabled: true,
        },
    ];

    const [state, dispatch] = useReducer(
        reducer,
        {
            headers,
            rows: [],
            sortBy: 'id',
            sortOrder: 'asc',
        },
        init,
    );

    const reducer = (state, action) => {
        const { nextElement, sortBy, type } = action;

        switch (type) {
            case 'CHANGE_SORT':
                if (state.sortBy === sortBy && state.sortOrder === 'asc') {
                    return { ...state, sortOrder: 'desc' };
                }

                if (state.sortBy !== sortBy) {
                    return { ...state, sortOrder: 'asc', sortBy };
                }

                if (state.sortBy === sortBy && state.sortOrder === 'desc') {
                    return { ...state, sortOrder: 'asc', sortBy: nextElement };
                }
                return state;
            case 'SELECT_ALL':
                return { ...state, rows: updateRows(state.rows, true) };
            case 'SELECT_ROW':
                return {
                    ...state,
                    rows: updateAtIndex(state.rows, action.index, !action.row._isChecked),
                };
            case 'UNSELECT_ALL':
                return { ...state, rows: updateRows(state.rows, false) };
            default:
                return state;
        }
    }

    const init = (initialState) => {
        const updatedRows = initialState.rows.map(row => {
            row._isChecked = false;
            return row;
        });
        return { ...initialState, rows: updatedRows };
    }

    const bulkActionProps = {
        icon: 'trash',
        onConfirm: () => {
            alert('Are you sure you want to delete these entries?');
        },
        translatedNumberOfEntry: 'entry',
        translatedNumberOfEntries: 'entries',
        translatedAction: 'Delete all',
    };

    const updateRows = (array, shouldSelect) => {
        array.map(row => {
            row._isChecked = shouldSelect;
            return row;
        });
    }

    const updateAtIndex = (array, index, value) =>
        array.map((row, i) => {
            if (index === i) {
                row._isChecked = value;
            }
            return row;
        });

    const areAllEntriesSelected = state.rows.every(
        row => row._isChecked === true,
    );

    const sortedRowsBy = sort(state.rows, [state.sortBy]);
    const sortedRows =
        state.sortOrder === 'asc' ? sortedRowsBy : sortedRowsBy.reverse();

    return (
        contentTypes ?
            <Table
                headers={state.headers}
                bulkActionProps={bulkActionProps}
                onClickRow={(e, data) => {
                    console.log(data);
                    alert('You have just clicked');
                }}
                onChangeSort={({
                    sortBy,
                    firstElementThatCanBeSorted,
                    isSortEnabled,
                }) => {
                    if (isSortEnabled) {
                        dispatch({
                            type: 'CHANGE_SORT',
                            sortBy,
                            nextElement: firstElementThatCanBeSorted,
                        });
                    }
                }}
                onSelect={(row, index) => {
                    dispatch({ type: 'SELECT_ROW', row, index });
                }}
                onSelectAll={() => {
                    const type = areAllEntriesSelected ? 'UNSELECT_ALL' : 'SELECT_ALL';
                    dispatch({ type });
                }}
                rows={sortedRows}
                showActionCollapse
                sortBy={state.sortBy}
                sortOrder={state.sortOrder}
                withBulkAction
                rowLinks={[
                    {
                        icon: <FontAwesomeIcon icon={faPencilAlt} />,
                        onClick: data => {
                            setInjectModalParams(data);
                            setInjectModal(true);
                            setIsOpen(true);
                        },
                    },
                    {
                        icon: <FontAwesomeIcon icon={faTrashAlt} />,
                        onClick: data => {
                            alert('You want to delete ' + data.uid);
                        },
                    },
                ]}
            /> : <></>);
}

export default Grid;
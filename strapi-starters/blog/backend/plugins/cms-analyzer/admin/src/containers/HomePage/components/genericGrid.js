
import React, { memo, useEffect, useState, useReducer } from 'react';
import { Table } from '@buffetjs/core';
import { sortBy as sort } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPencilAlt,
    faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';

const uuidv4 = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
};

const GenericGrid = ({ headers, datasource, onClick, onSelectRow, onSelectRows }) => {
    const init = (initialState) => {
        const updatedRows = initialState.rows.map(row => {
            if (!row.id)
                row.id = uuidv4();
            row._isChecked = false;
            return row;
        });
        return { ...initialState, rows: updatedRows };
    };
    const updateRows = (array, shouldSelect) => {
        return array.map(row => {
            row._isChecked = shouldSelect;
            return row;
        });
    };
    const updateRow = (array, selectedRow) => {
        return array.map(row => {
            if(row.id === selectedRow.id)
                row._isChecked = !row._isChecked;
            return row;
        });
    };
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
                    rows: updateRow(state.rows, action.row),
                };
            case 'UNSELECT_ALL':
                const newState = { ...state, rows: updateRows(state.rows, false) };
                return newState;
            default:
                return state;
        }
    };
    const bulkActionProps = {
        icon: 'trash',
        onConfirm: () => {
            alert('Are you sure you want to delete these entries?');
        },
        translatedNumberOfEntry: 'entry',
        translatedNumberOfEntries: 'entries',
        translatedAction: 'Delete all',
    };
    const [gridData, SetGridData] = useState();
    let initialState = {
        headers,
        rows: [],
        sortBy: 'id',
        sortOrder: 'asc',
    }
    const [state, dispatch] = useReducer(
        reducer,
        initialState
    );
    const sortedRowsBy = sort(state.rows, [state.sortBy]);
    const sortedRows = state.sortOrder === 'asc' ? sortedRowsBy : sortedRowsBy.reverse();

    useEffect(() => {
        datasource().then((data) => {
            const initial = init({ ...initialState, rows: data });
            state.rows = initial.rows;
            console.log("state.rows", state.rows);
            SetGridData(data);
        });
    }, []);

    return (
        gridData ?
            <Table
                headers={state.headers}
                bulkActionProps={bulkActionProps}
                onClickRow={(e, data) => {
                    console.log(data);
                    if (onclick) onClick(data);
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
                    if (onSelectRow) onSelectRow(row, index);
                }}
                onSelectAll={() => {
                    console.log("state.rows", state.rows.every(row => row._isChecked === true));
                    const type = state.rows.every(row => row._isChecked === true) ? 'UNSELECT_ALL' : 'SELECT_ALL';
                    dispatch({ type });
                    /*if (onSelectRows) onSelectRows();*/
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
                            alert("edit" + data.id);
                        },
                    },
                    {
                        icon: <FontAwesomeIcon icon={faTrashAlt} />,
                        onClick: data => {
                            alert('You want to delete ' + data.id);
                        },
                    },
                ]}
            /> : <></>);
}

export default GenericGrid;
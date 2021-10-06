import React, { memo, useEffect, useState, useReducer } from 'react';
import { Button, AttributeIcon } from '@buffetjs/core';
import {
    HeaderModal,
    HeaderModalTitle,
    Modal,
    ModalBody,
    ModalFooter
} from 'strapi-helper-plugin';
import { Table } from '@buffetjs/core';
import { sortBy as sort } from 'lodash';
import collectionsMiddleware from '../../../middlewares/collections/ui-contentCollection';

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

const ModalAdd = ({ isOpen, onOpened, onClosed, onToggle, params }) => {
    const [contentData, setContentData] = useState();
    const [state, dispatch] = useReducer(
        reducer,
        {
            headers: [],
            rows: [],
            sortBy: 'id',
            sortOrder: 'asc',
        },
        init,
    );

    useEffect(() => {
        // get contentTypes
        collectionsMiddleware.find(params.collectionName).then((items) => {
            if (items && items[0]) {
                for (const [key, value] of Object.entries(items[0])) {
                    if (key.indexOf('_') == -1)
                        state.headers.push({
                            name: key,
                            value: key,
                            isSortEnabled: true,
                        });
                }
            }
            state.rows = items;
            setContentData(items);
        });
    }, []);

    const areAllEntriesSelected = state.rows.every(
        row => row._isChecked === true,
    );

    const sortedRowsBy = sort(state.rows, [state.sortBy]);
    const sortedRows =
        state.sortOrder === 'asc' ? sortedRowsBy : sortedRowsBy.reverse();

    return (
        <Modal
            isOpen={isOpen}
            onOpened={() => { onOpened() }}
            onClosed={() => {
                onClosed();
            }}
            onToggle={() => { onToggle() }}
            withoverflow={"true"}
        >
            <HeaderModal>
                <section style={{ alignItems: 'center' }}>
                    <AttributeIcon type='enum' />
                    <HeaderModalTitle style={{ marginLeft: 15 }}>Modal Title</HeaderModalTitle>
                </section>
            </HeaderModal>
            <ModalBody>
                <div className="container-fluid">
                    {contentData ?
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
                                /*{
                                    icon: <FontAwesomeIcon icon={faPencilAlt} />,
                                    onClick: data => {
                                        setIsOpen(true);
                                    },
                                },
                                {
                                    icon: <FontAwesomeIcon icon={faTrashAlt} />,
                                    onClick: data => {
                                        alert('You want to delete ' + data.uid);
                                    },
                                },*/
                            ]}
                        />
                        : <></>}
                </div>
            </ModalBody>
            <ModalFooter>
                <section style={{ alignItems: 'center' }}>
                    <Button
                        color="cancel"
                        onClick={(e) => {
                            onClosed();
                        }}>
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        style={{ marginLeft: 'auto' }}

                        onClick={(e) => {
                            onClosed();
                        }}>
                        Save
                    </Button>
                </section>
            </ModalFooter>
        </Modal>
    );
}
export default memo(ModalAdd)
import { useRef, useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import Table from '@/components/ui/Table'
import Checkbox from '@/components/ui/Checkbox'
// import { data10 } from './data'
import type { ChangeEvent } from 'react'
import type { CheckboxProps } from '@/components/ui/Checkbox'
import type { ColumnDef } from '@tanstack/react-table'
import Sorter from '@/components/ui/Table/Sorter'

type CheckBoxChangeEvent = ChangeEvent<HTMLInputElement>

interface IndeterminateCheckboxProps extends Omit<CheckboxProps, 'onChange'> {
  onChange: (event: CheckBoxChangeEvent) => void
  indeterminate: boolean
  onCheckBoxChange?: (event: CheckBoxChangeEvent) => void
  onIndeterminateCheckBoxChange?: (event: CheckBoxChangeEvent) => void
}

type Person = {
  created_at: string
  createdby: number
  description: string
  id: number
  lat: number
  lng: number
  leaflet_stamp: number
  organisation: number
  subtitle: string
  tags: string
  title: string
}

const { Tr, Th, Td, THead, TBody } = Table

function IndeterminateCheckbox({
  indeterminate,
  onChange,
  ...rest
}: IndeterminateCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof indeterminate === 'boolean' && ref.current) {
      ref.current.indeterminate = !rest.checked && indeterminate
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, indeterminate])

  return <Checkbox ref={ref} onChange={(_, e) => onChange(e)} {...rest} />
}

type PropsType = {
  tableData: any[]
  globalFilter: string
  openProjectInfo: (id: number) => void
  openZoom: (id: number) => void
}

function MapTable({
  tableData,
  globalFilter,
  openProjectInfo,
  openZoom,
}: PropsType) {
  const [rowSelection, setRowSelection] = useState({})

  const columns = useMemo<ColumnDef<Person>[]>(() => {
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="text-base capitalize text-center flex justify-center items-center">
            <i className="fa fa-cog"></i>
            &nbsp;Action
          </div>
        ),
        cell: ({ row }) => (
          <div className="px-1 text-center">
            <a
              className="zoom"
              title="Zoom"
              style={{ marginRight: '10px' }}
              onClick={() => openZoom(row.original.leaflet_stamp)}
            >
              <i className="fa fa-search-plus text-[#0d6efd] text-[16px]"></i>
            </a>
            <a
              className="identify"
              title="Identify"
              onClick={() => openProjectInfo(row.original.leaflet_stamp)}
            >
              <i className="fa fa-info-circle text-[#0d6efd] text-[16px]"></i>
            </a>
          </div>
        ),
      },
      {
        header: 'UID',
        accessorKey: 'id',
      },
      {
        header: 'Title',
        accessorKey: 'title',
      },
      {
        header: 'Address',
        accessorKey: 'subtitle',
      },
      {
        header: 'Description',
        accessorKey: 'description',
      },
      {
        header: 'Tags',
        accessorKey: 'tags',
      },
      {
        header: 'Created By',
        accessorKey: 'createdby',
      },
      {
        header: 'Organisation',
        accessorKey: 'organisation',
      },
      {
        header: 'Latitude',
        accessorKey: 'lat',
      },
      {
        header: 'Long',
        accessorKey: 'lng',
      },
      {
        header: 'Created',
        accessorKey: 'created_at',
      },
    ]
  }, [])

  const [data, setData] = useState<Person[]>(tableData)

  const [globalFilterData, setGlobalFilterData] = useState(globalFilter)

  useEffect(() => {
    setData(tableData)
    setGlobalFilterData(globalFilter)
  }, [tableData, globalFilter])

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      // globalFilterData
    },
    enableRowSelection: true, //enable row selection for all rows
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilterData,
  })

  return (
    <>
      <Table className="table-bordered table-hover inline-table">
        <THead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Tr key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => {
                if (index === 0) {
                  return (
                    <Th
                      key={header.id}
                      colSpan={header.colSpan}
                      className="w-[100px] px-0 text-center text-base align-middle"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </Th>
                  )
                }
                return (
                  <Th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="w-[100px] px-0 text-center align-middle"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? 'cursor-pointer select-none'
                            : '',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                        className="mr-2 pl-2 capitalize flex-row text-base flex justify-between items-center"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {<Sorter sort={header.column.getIsSorted()} />}
                      </div>
                    )}
                  </Th>
                )
              })}
            </Tr>
          ))}
        </THead>
        <TBody className="overflow-y-scroll">
          {table.getRowModel().rows.map((row) => {
            return (
              <Tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <Td key={cell.id} className="text-start p-1 text-base pr-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </Td>
                  )
                })}
              </Tr>
            )
          })}
        </TBody>
      </Table>
    </>
  )
}

export default MapTable

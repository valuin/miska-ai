"use client";
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Skeleton } from "../ui/skeleton";

export const TableComponent = ({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string[] & { isBold?: boolean })[];
}) => (
  <Table className="text-black dark:text-white">
    <TableHeader>
      <TableRow>
        {headers.map((h, i) => (
          <TableHead key={i} className="text-black dark:text-white">
            {h}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((row, ri) => (
        <TableRow key={ri} className={row.isBold ? "font-bold" : ""}>
          {row.map((cell, ci) => (
            <TableCell key={ci} className="text-black dark:text-white">
              {cell}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export const SkeletonTables = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-6 w-full" />
    ))}
  </div>
);

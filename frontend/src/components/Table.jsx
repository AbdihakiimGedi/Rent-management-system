import React from 'react';

const Table = ({ data }) => (
  <table className="min-w-full border">
    <thead>
      <tr>
        {data.length > 0 &&
          Object.keys(data[0]).map((key) => (
            <th key={key} className="border px-4 py-2">{key}</th>
          ))}
      </tr>
    </thead>
    <tbody>
      {data.map((row, idx) => (
        <tr key={idx}>
          {Object.values(row).map((value, i) => (
            <td key={i} className="border px-4 py-2">{value}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const DataTable = ({ data }) => (
  <Table data={data} />
);

export default DataTable;
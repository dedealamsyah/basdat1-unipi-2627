declare module "sql.js" {
  interface QueryExecResult {
    columns: string[];
    values: any[][];
  }

  interface Database {
    exec(sql: string): QueryExecResult[];
    run(sql: string): void;
    close(): void;
  }

  interface SqlJsStatic {
    Database: new () => Database;
  }

  interface InitSqlJsOptions {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(opts?: InitSqlJsOptions): Promise<SqlJsStatic>;
}

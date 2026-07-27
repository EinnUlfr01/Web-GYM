import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import * as sql from 'mssql';
import { config } from '../config/config';

if(process.env.SELLER002_ACCEPTANCE!=='1')throw new Error('SELLER002_ACCEPTANCE=1 is required');
const target=config.db.database;
if(target==='GYMFIT_DB'||!/^GYMFIT_DB_SELLER002_ACCEPTANCE_[A-Za-z0-9_]+$/.test(target))throw new Error('Unsafe acceptance database name');
const action=process.argv[2];
const masterConfig={...config.db,database:'master'};

function batches(source:string){const output:string[]=[];let current:string[]=[];for(const line of source.split(/\r?\n/)){if(/^\s*GO\s*$/i.test(line)){if(current.join('\n').trim())output.push(current.join('\n'));current=[];}else current.push(line);}if(current.join('\n').trim())output.push(current.join('\n'));return output;}

async function run(){
  const pool=await new sql.ConnectionPool(masterConfig).connect();
  try{
    if(action==='drop'){await pool.request().batch(`IF DB_ID(N'${target}') IS NOT NULL BEGIN ALTER DATABASE [${target}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${target}]; END`);console.log(`[ACCEPTANCE DB DROPPED] ${target}`);return;}
    if(action!=='setup')throw new Error('Expected setup or drop');
    await pool.request().batch(`IF DB_ID(N'${target}') IS NOT NULL BEGIN ALTER DATABASE [${target}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${target}]; END; CREATE DATABASE [${target}];`);
    const schema=await fs.readFile(path.resolve(__dirname,'../../../db/schema.sql'),'utf8');
    const marker=/USE\s+GYMFIT_DB\s*;\s*\r?\nGO\s*\r?\n/i.exec(schema);if(!marker)throw new Error('Schema database marker not found');
    const body=schema.slice(marker.index+marker[0].length).replace(/\bGYMFIT_DB\b/g,target);
    const dbPool=await new sql.ConnectionPool({...config.db,database:target}).connect();
    try{
      for(const batch of batches(body))await dbPool.request().batch(batch);
      await dbPool.request().batch(`DROP TRIGGER IF EXISTS dbo.TR_SellerApplicationStatusHistory_Immutable;
        DROP TABLE IF EXISTS dbo.SellerApplicationStatusHistory;
        DROP TABLE IF EXISTS dbo.SellerApplications;`);
      const constraints=await dbPool.request().query(`SELECT cc.name FROM sys.check_constraints cc WHERE cc.parent_object_id=OBJECT_ID(N'dbo.Users') AND LOWER(cc.definition) LIKE N'%role%in%'`);
      if(constraints.recordset.length!==1)throw new Error('Expected one Users role constraint');
      await dbPool.request().batch(`ALTER TABLE dbo.Users DROP CONSTRAINT [${String(constraints.recordset[0].name).replace(/]/g,']]')}]; ALTER TABLE dbo.Users ADD CONSTRAINT CK_Users_Role_Acceptance CHECK(role IN(N'member',N'coach',N'admin',N'seller'));`);
      const hash=await bcrypt.hash(`Aa1!${Date.now()}Acceptance`,12);
      await dbPool.request().input('email',sql.NVarChar(255),`preexisting-seller-${Date.now()}@example.test`).input('hash',sql.NVarChar(255),hash)
        .query(`INSERT dbo.Users(email,password,name,role,is_active,email_verified) VALUES(@email,@hash,N'Preexisting Seller',N'seller',1,1)`);
    }finally{await dbPool.close();}
    console.log(`[ACCEPTANCE DB READY] ${target}`);
  }finally{await pool.close();}
}
run().catch(error=>{console.error('[ACCEPTANCE DB FAIL]',error instanceof Error?error.message:error);process.exitCode=1;});

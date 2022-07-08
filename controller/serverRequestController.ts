import { Request, Response } from 'express';
import { 
  setRequiredVariable, 
  encryptData, 
  checkLoggingKey,
  checkLoginDetails,
  checkUserDetails
} from '../helpers';
import logger from '../logger';
// import { addJobs } from './helpers/queue_helper';
import axios from 'axios'


// import { QuickDB } from 'quick.db';
// const db = QuickDB({ filePath: 'db/main.sqlite' });

// var user_task_control = new db.table('user_task_control')

var maxServers: Number = parseInt(<string>setRequiredVariable('MAX_SERVERS'), 10);
var mapServers: any = {
  1: 'SERVER_ONE',
  2: 'SERVER_TWO'
}
var serverTurn = 1;

const hello = async (req: Request, res: Response) => {
  return res.status(200).send("Hello")
}

const my_services = async (req: Request, res: Response) => {
  try {
    logger.info('\n\n')

    await checkLoggingKey(req, logger, res, 'm_services', 'my_services')
    logger.info("loadbalancer: my_services: " + req.body.body.login_api_apiKey_S.toString() +": " + encryptData(JSON.stringify(req.body)))
    
    let res_user: any = await checkLoginDetails(req, logger, res, "my_services")
    if(!res_user.email) {return res_user}
    logger.info("loadbalancer: my_services:" + req.body.body.login_api_apiKey_S.toString() +": res_user: " + encryptData(JSON.stringify(res_user)))
    
    var url = `http://${setRequiredVariable('SERVER_DB_URL')}:${setRequiredVariable('SERVER_DB_PORT')}${setRequiredVariable('GET_SERVICES_ENDPOINT')}`
    var res_db = await axios.post(url,
      {
        email: res_user.email, 
        logger_Key: req.body.body.login_api_apiKey_S.toString()
      }
    )

    logger.info("loadbalancer: my_services: data_received: " + res_db.data.logger_key +": " + encryptData(JSON.stringify(req.body)))
    if(res.headersSent) {
      return
    }
    return res.status(200).send({services: res_db.data.tasks})
  } catch (e: any) {
    if(res.headersSent) {
      return
    }
    if(e.response) {
      logger.info('loadbalancer: my_services_error: ' + req.body.body.login_api_apiKey_S + ": e_response" + e.response.data.message.toString() + " for__:" + encryptData(JSON.stringify(req.body)))
    } else if(e.stack) {
      logger.info('loadbalancer: my_services_error: ' + req.body.body.login_api_apiKey_S + ": e_message: " + e.message + ": e_stack: " + e.stack.toString()+ " for__:" + encryptData(JSON.stringify(req.body)))
    } else {
      logger.info('loadbalancer: my_services_error: ' + req.body.body.login_api_apiKey_S + ": e_to_string: " + e.toString() + " for__:" + encryptData(JSON.stringify(req.body)))
    }

    return res.status(500).json({
      'message': 'm_services: Unable to fetch data.'
    })
  }

}

const encrypt_login = async (req: Request, res: Response) => {
  try {
    logger.info('\n\n')

    await checkLoggingKey(req, logger, res, 'e_login', 'encrypt_login')

    logger.info("loadbalancer: encrypt_login: " + req.body.body.login_api_apiKey_S.toString() +": " + encryptData(JSON.stringify(req.body)))
     
    let _res: any = await checkLoginDetails(req, logger, res, "encrypt_login")
    if(!_res.email) {return _res}

    var _key = req.body.body.login_api_apiKey.toString().substring(0,15) + encryptData(req.body.body.login_api_apiKey)
    var _secret = encryptData(req.body.body.login_api_secretKey)
    
    return res.status(200).send({login_api_apiKey_enc: _key, login_api_secretKey_enc: _secret, message: '<span class="text-grey-10 text-bold">Login key <span class="text-blue-grey-8">Saved!</span></span>'})
  } catch (e: any) {
    if(res.headersSent) {
      return
    }
    logger.info('loadbalancer: encrypt_login_error: ' + req.body.body.login_api_apiKey_S +": e_message: " + e.message + ": e_stack: " + e.stack.toString() + " for__:" + encryptData(JSON.stringify(req.body)))
    console.log("headers Sent!!")
    return res.status(500).json({
      'message': 'e_login: Unexpected error: ' + e.message
    })
  }

}

const create_new = async (req: Request, res: Response) => {
  try {
    logger.info('\n\n')
    await checkLoggingKey(req, logger, res, 'c_new', 'create_new')
    if(typeof req.body.body.login_api_apiKey != "string") throw "error 1248"
    if(typeof req.body.body.login_api_secretKey != "string") throw "error 1284"
    if(typeof req.body.body.login_api_exchangeURL != "string") throw "error 1428"
    if(typeof req.body.body.api_url != "string") throw "error 1482"
    if(typeof req.body.body.api_key != "string") throw "error 1824"
    if(typeof req.body.body.api_secret != "string") throw "error 1842"
    if(typeof req.body.body.side != "string") throw "error 2148"
    if(typeof req.body.body.symbol != "object") throw "error 2184"
    if(typeof req.body.body.symbol.value != "string") throw "error 2418"
    if(typeof req.body.body.symbol.value.split('/')[0] != "string") throw "error 2481"
    if(req.body.body.type != "limit") throw "error 2814"
    if(typeof req.body.body.seconds_interval != "string") throw "error 2841"
    if(typeof req.body.body.spread_percent != "string") throw "error 4128"
    if(typeof req.body.body.amount != "string") throw "error 4182"
    if(typeof req.body.body.task_uuid != "string") throw "error 4218"
    if(!(req.body.body.amount <= 100)) throw "error 4281" // !() also tacking problem of someone passing string in amount ("hello" <=/>= 100) will return always false
    if(!(req.body.body.amount >= 0.001)) throw "error 4812"
    if(!(req.body.body.spread_percent <= 2)) throw "error 4821"
    if(!(req.body.body.spread_percent >= 0.01)) throw "error 8124"
    if(!(req.body.body.seconds_interval <= 10000)) throw "error 8142" 
    if(!(req.body.body.seconds_interval >= 10)) throw "error 8214" // TODO: change seconds inteval to 400 here and in front-end as min
    if(isNaN(parseFloat(req.body.body.amount))) throw "error 8241"
    if(isNaN(parseFloat(req.body.body.spread_percent))) throw "error 8412"
    if(isNaN(parseFloat(req.body.body.seconds_interval))) throw "error 8421"
    if(typeof req.body.body.api_name != "string") throw "error 161248"
    if(typeof req.body.body.api_desc != "string") throw "error 161428"
    logger.info('loadbalancer: create_new: called: ' + encryptData(JSON.stringify(req.body)))
  } catch(e: any) {
    if(res.headersSent) {
      return
    }
    logger.info('loadbalancer: create_new: type_checks: ' + req.body.body.login_api_apiKey_S.toString() + ": " + "e_message: " + e + ": e_stack: " + e.stack + " for__:" + encryptData(JSON.stringify(req.body)))
    // yt for ty of type (because it is a type error, illegal)
    return res.status(500).json({
      'message': 'c_new_yt: Unexpected error: ' + e
    })
  }
  try {
    let res_user: any = await checkLoginDetails(req, logger, res, "create_new")
    if(!res_user.email) {return res_user}
    logger.info("loadbalancer: create_new: user_scan:" + req.body.body.login_api_apiKey_S.toString() +": res_user: " + encryptData(JSON.stringify(res_user)))
    
    let res_api: any = await checkUserDetails(req, logger, res, "create_new")
    if(!res_api.email) {return res_api}
    logger.info("loadbalancer: create_new: api_scan:" + req.body.body.login_api_apiKey_S.toString() +": res_api: " + encryptData(JSON.stringify(res_api)))
    
    
    var url = `http://${setRequiredVariable('SERVER_DB_URL')}:${setRequiredVariable('SERVER_DB_PORT')}${setRequiredVariable('GET_SERVICES_ENDPOINT')}`
    var res_db = await axios.post(url,
      {
        email: res_user.email, 
        logger_Key: req.body.body.login_api_apiKey_S.toString()
      }
    )
    logger.info("loadbalancer: create_new: my_services:" + res_db.data.logger_key +": res_db: " + encryptData(JSON.stringify(res_db.data)))

    if(res_db.data.tasks.length >= 5) {
      throw 'Current limit is 5 for running/stopped tasks!'
    }

    var url = `http://${setRequiredVariable(`${mapServers[serverTurn]}_URL`)}:${setRequiredVariable(`${mapServers[serverTurn]}_PORT`)}${setRequiredVariable('CREATE_NEW_ENDPOINT')}`
    logger.info("loadbalancer: create_new: create_new_constructed_url: " + req.body.body.login_api_apiKey_S.toString() +": " + url.toString())
    
    var result: any = await callCreateNewURL(url, req.body, res, res_user.email, res_api.email, req.body.body.login_api_apiKey_S.toString())
    serverTurn++
    if(serverTurn > maxServers) {
      serverTurn = 1
    }
    return result
  } catch (e: any) {
    if(res.headersSent) {
      return
    }
    logger.info('loadbalancer: create_new: ' + ": e_message: " + e + ": e_stack: " + e.stack + " for__:" + encryptData(JSON.stringify(req.body)))
    return res.status(500).json({
      'message': 'c_new: Unexpected error: ' + e
    })
  }
}


const delete_service = async (req: Request, res: Response) => {
  // first delete order then delete service
  try {
    logger.info('\n\n')
    await checkLoggingKey(req, logger, res, 'd_service', 'delete_service')
    if(typeof req.body.body.login_api_apiKey != "string") throw "error 1248"
    if(typeof req.body.body.login_api_secretKey != "string") throw "error 1284"
    if(typeof req.body.body.id != "string") throw "error 1824"
    if(req.body.body.id.length != 40) throw "error 1842"
    
    logger.info('loadbalancer: delete_service: called: ' + encryptData(JSON.stringify(req.body)))
  } catch(e: any) {
    if(res.headersSent) {
      return
    }
    logger.info('loadbalancer: delete_service: type_checks: ' + req.body.body.login_api_apiKey_S.toString() + ": " + "e_message: " + e + ": e_stack: " + e.stack + " for__:" + encryptData(JSON.stringify(req.body)))
    return res.status(500).json({
      'message': 'd_service_yt: Unexpected error: ' + e
    })
  }

  try {
    let res_user: any = await checkLoginDetails(req, logger, res, "create_new")
    if(!res_user.email) {return res_user}
    logger.info("loadbalancer: delete_service: user_scan: " + req.body.body.login_api_apiKey_S.toString() +": res_user: " + encryptData(JSON.stringify(res_user)))
    
    var url = `http://${setRequiredVariable('SERVER_DB_URL')}:${setRequiredVariable('SERVER_DB_PORT')}${setRequiredVariable('GET_SERVICES_ENDPOINT')}`
    var res_db = await axios.post(url,
      {
        email: res_user.email, 
        logger_Key: req.body.body.login_api_apiKey_S.toString()
      }
    )
    logger.info("loadbalancer: delete_service: my_services: response: " + res_db.data.logger_key +": res_db: " + encryptData(JSON.stringify(res_db.data)))
    let tasks = res_db.data.tasks.filter((x: any) => x.taskID == req.body.body.id)
    var _res_db: any
    if(tasks) {
      var url = `http://${setRequiredVariable('SERVER_DB_URL')}:${setRequiredVariable('SERVER_DB_PORT')}/delete_service`
      _res_db = await axios.post(url,
        {
          ...req.body.body, status: 'deleted'
        }
      )
      logger.info("loadbalancer: delete_service: deleted_task: response: " + _res_db.data.logger_key +": res_db: " + encryptData(JSON.stringify(res_db.data)))
    }
    return res.status(200).send({message: _res_db.data.message, status: 'deleted'})
  } catch (e: any) {
    if(res.headersSent) {
      return
    }
    logger.info('loadbalancer: delete_service: ' + ": e_message: " + e + ": e_stack: " + e.stack + " for__:" + encryptData(JSON.stringify(req.body)))
    return res.status(500).json({
      'message': 'd_service: Unexpected error: ' + e
    })
  }
}


export {
  my_services,
  create_new,
  encrypt_login,
  delete_service,
  hello
}



async function callCreateNewURL(url: string, req_body: any, res: Response, login_email: string, api_email: string, logger_key: string) {
  try {
    let _res = await axios.post(url, {
      body: req_body.body,
      login_email: login_email,
      api_email: api_email,
    })
    logger.info("loadbalancer: create_new_function: after_calling_job_server: " + logger_key + ": " + encryptData(JSON.stringify(_res.data)))
    if(_res.data.status != 'running') {
      throw _res.data.status
    }
    return res.status(200).send(_res.data.message)
  } catch(e: any) {
    logger.info("loadbalancer: create_new_function_error: " + e.toString())
    return res.status(500).send({
      'message': 'c_new_fn: Unexpected error: ' + e.toString().substring(17)
    })
  }
}

// Testing...

// function testRun() {
//   var constructPostObj = {
//     api_key: setRequiredVariable('APIKEY'),
//     api_secret: setRequiredVariable('APISECRET'),
//     api_url: setRequiredVariable('APIURL')
//   }
//   axios.post("http://localhost:3000/create_new", {
//         body: constructPostObj
//   }).then((res: any) => {
//     console.log(res.data)
//   }).catch((e: any) => {
//     console.log(e.response.data)
//     console.log(e.message)
//   })
// }
// testRun()
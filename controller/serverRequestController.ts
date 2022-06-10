import { Request, Response } from 'express';
import { 
  setRequiredVariable, 
  encryptData, 
  checkLoginKey,
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

    await checkLoginKey(req, logger, res, 'm_services', 'my_services')
    logger.info("loadbalancer: my_services: " + req.body.body.login_api_apiKey_S.toString() +": " + encryptData(JSON.stringify(req.body)))
    
    let res_user: any = await checkLoginDetails(req, logger, res, "my_services")
    if(!res_user.email) {return res_user}
    logger.info("loadbalancer: my_services:" + res_db.data.logger_key +": res_user: " + encryptData(JSON.stringify(res_user)))
    
    var url = `http://${setRequiredVariable('SERVER_DB_URL')}:${setRequiredVariable('SERVER_DB_PORT')}${setRequiredVariable('GET_SERVICES_ENDPOINT')}`
    var res_db = await axios.post(url,
      {
        email: res_user.email, 
        logger_Key: req.body.body.login_api_apiKey_S.toString()
      }
    )

    logger.info("loadbalancer: my_services: data_received: " + res_db.data.logger_key +": " + encryptData(JSON.stringify(req.body)))
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

    await checkLoginKey(req, logger, res, 'e_login', 'encrypt_login')

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
    // TODO: create a check all fields (limits etc. function here)
    await checkLoginKey(req, logger, res, 'c_new', 'create_new')
    let res_user: any = await checkLoginDetails(req, logger, res, "create_new")
    if(!res_user.email) {return res_user}
    logger.info("loadbalancer: create_new: my_services:" + res_db.data.logger_key +": res_user: " + encryptData(JSON.stringify(res_user)))
    
    let res_api: any = await checkUserDetails(req, logger, res, "create_new")
    if(!res_api.email) {return res_api}
    logger.info("loadbalancer: create_new: my_services:" + res_db.data.logger_key +": res_api: " + encryptData(JSON.stringify(res_api)))
    
    
    var url = `http://${setRequiredVariable('SERVER_DB_URL')}:${setRequiredVariable('SERVER_DB_PORT')}${setRequiredVariable('GET_SERVICES_ENDPOINT')}`
    var res_db = await axios.post(url,
      {
        email: res_user.email, 
        logger_Key: req.body.body.login_api_apiKey_S.toString()
      }
    )
    logger.info("loadbalancer: create_new: my_services:" + res_db.data.logger_key +": res_db: " + encryptData(JSON.stringify(res_db.data)))

    if(res_db.data.tasks.length >= 5) {
      throw 'Current limit is 5 running/stopped tasks!'
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
    logger.info('loadbalancer: create_new: ' + ": e_message: " + e.message + ": e_stack: " + e.stack.toString() + " for__:" + encryptData(JSON.stringify(req.body)))
    return res.status(500).json({
      'message': 'c_new: Unexpected error: ' + e.message
    })
  }
}


export {
  my_services,
  create_new,
  encrypt_login,
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
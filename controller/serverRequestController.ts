import { Request, Response } from 'express';
import { 
  setRequiredVariable, 
  encryptData, 
  getUserDetails, 
  checkLoginKey,
  checkUserDetails
} from '../helpers';
import logger from '../logger';
// import { addJobs } from './helpers/queue_helper';
import axios from 'axios'


// import { QuickDB } from 'quick.db';
// const db = QuickDB({ filePath: 'db/main.sqlite' });

// var user_task_control = new db.table('user_task_control')

var maxServers = 1;
var mapServers: any = {
  1: 'SERVER_ONE',
  2: 'SERVER_TWO'
}
var serverTurn = 1;

const my_services = async (req: Request, res: Response) => {
  try {
    await checkLoginKey(req, logger, res)

    logger.info("my_services: " + req.body.body.login_api_apiKey_S.toString() +": " + encryptData(JSON.stringify(req.body)))
    var url = `http://${setRequiredVariable('SERVER_DB_URL')}:${setRequiredVariable('SERVER_DB_PORT')}${setRequiredVariable('GET_SERVICES_ENDPOINT')}`
    
    let _res: any = await checkUserDetails(req, logger, res, "my_services")
    if(!_res.email) {return _res}
    



    var res = await axios.get(url, {
      body: req.body
    })

    return res.status(200).send({services: res.data})
  } catch (e: any) {
    logger.error('my_services_error: ' + req.body.body.login_api_apiKey_S.toString() +": " + e.toString() + " for__:" + encryptData(JSON.stringify(req.body)))
    return res.status(500).json({
      'message': 'Unable to fetch data.'
    })
  }

}

const encrypt_login = async (req: Request, res: Response) => {
  try {
    await checkLoginKey(res, logger, req)

    logger.info("encrypt_login: " + req.body.body.login_api_apiKey_S.toString() +": " + encryptData(JSON.stringify(req.body)))
     
    let _res: any = await checkUserDetails(req, logger, res, "encrypt_login")
    if(!_res.email) {return _res}

    if(req.body.body.login_api_apiKey_S.toString() != req.body.body.login_api_apiKey.toString().subString(0,15)) {
      logger.info("encrypt_login: keys_not_matched: " + req.body.body.login_api_apiKey_S.toString() +": " + encryptData(JSON.stringify(req.body)))
      return res.status(500).json({
        'message': 'Error from client side!'
      })
    }

    var _key = req.body.body.login_api_apiKey.toString().subString(0,15) + encryptData(req.body.body.login_api_apiKey)
    var _secret = encryptData(req.body.body.login_api_secretKey)
    
    return res.status(200).send({login_api_apiKey_enc: _key, login_api_secretKey_enc: _secret, message: '<span class="text-grey-10 text-bold">Login key <span class="text-blue-grey-8">Saved!</span></span>'})
  } catch (e: any) {
    logger.error('encrypt_login_error: ' + req.body.body.login_api_apiKey_S.toString() +": " + e.toString() + " for__:" + encryptData(JSON.stringify(req.body)))
    return res.status(500).json({
      'message': 'Unexpected error!'
    })
  }

}

const create_new = async (req: Request, res: Response) => {
  try {
    checkLoginKey(res, logger, req)
    
    // let add_jobs = addJobs(req.body)
    logger.info("create_new: " + req.body.body.login_api_apiKey_S.toString() +": " + encryptData(JSON.stringify(req.body)))
    // TODO: change https to http if not work
    var url = `http://${setRequiredVariable(`${mapServers[serverTurn]}_URL`)}:${setRequiredVariable(`${mapServers[serverTurn]}_PORT`)}${setRequiredVariable('CREATE_NEW_ENDPOINT')}`
    logger.info("create_new_constructed_url: " + req.body.body.login_api_apiKey_S.toString() +": " + url.toString())
    
    var result: any = await callCreateNewURL(url, req.body, res)
    serverTurn++
    if(serverTurn > maxServers) {
      serverTurn = 1
    }
    return result

    // var user_details = await getUserDetails(
    //   req.body.body.api_key,
    //   req.body.body.api_secret,
    //   req.body.body.api_url
    // )

    // console.log(user_details)
    // user_task_control.set(`${user_details.email}.id`, user_details.id)

    // console.log(user_details)
    // console.log('DB all')
    // console.log(user_task_control.all())
    // console.log(user_task_control.get(user_details.email))
    // <Result>
    // console.log(req.body.body)
    // {
    //   unique_id: 'b24f29c9-dc65-4167-9833-e3f160d85503',
    //     api_url: 'https://api.fine.exchange',
    //       api_key: 'a83849471ef22435094d1536d3287ad14c691cc3',
    //         api_secret: 'a58873f24e1804672d9fbfc4829b7c9a856eb60ed1b8148a32',
    //           'task_data_type_plain_pretext_b24f29c9-dc65-4167-9833-e3f160d85503': 'buy',
    //             'task_data_api_plain_pretext_b24f29c9-dc65-4167-9833-e3f160d85503': {
    //     label: 'first api testing',
    //       url: 'https://api.fine.exchange',
    //         description: 'Fine Exchange Mainnet',
    //           api_key: '룪⸈굫왞䆤⩇წ㦨僮䡅錟ֱ뮬龉짰䂻ʃጡ뢼崢滫♊棿겻◬홱擗\uda50ವ壋䆄\udbb8F鈮輁韒ؙ聣뫕ቯ۶䁬ﭐ',
    //             api_secret: '룪⸅굠왝䆮⨕ჩ㦨傹䡏錝ֱ뮩龋짲䃦ʎ፲룯嵲滩☖棾결▶홱擕\uda0d೥壇䇒\udbb8\x1A鉽轔鞁ُ芖䢄⠟鿠ꅠ췚⇦䨗蹞㿚᐀奱私롛㉪',
    //               api_update_date: '12/05/2022, 08:13:09'
    //   },
    //   'task_data_pair_plain_pretext_b24f29c9-dc65-4167-9833-e3f160d85503': { label: 'ETH/USDT', value: 'ETH/USDT' },
    //   'task_data_interval_plain_pretext_b24f29c9-dc65-4167-9833-e3f160d85503': '1313',
    //   'task_data_spread_percent_plain_pretext_b24f29c9-dc65-4167-9833-e3f160d85503': '1',
    //   'task_data_state_plain_pretext_b24f29c9-dc65-4167-9833-e3f160d85503': 'stopped',
    //   'task_data_date_plain_pretext_b24f29c9-dc65-4167-9833-e3f160d85503': '22/05/2022, 15:02:10',
    //   'task_data_amount_plain_pretext_b24f29c9-dc65-4167-9833-e3f160d85503': '3',
    //   'task_data_id_plain_pretext_b24f29c9-dc65-4167-9833-e3f160d85503': 'b24f29c9-dc65-4167-9833-e3f160d85503'
    // }
    // </Result>

    // logger.info("create_new: addJobs: " + add_jobs)
    // console.log(JSON.stringify(req.body))
    // {"body":{"task_data_type_plain_pretext_592fb5ab-d1dd-448f-8585-d45cd2fbb52f":"sell","task_data_api_plain_pretext_592fb5ab-d1dd-448f-8585-d45cd2fbb52f":{"label":"first api testing","url":"https://api.fine.exchange","description":"Fine Exchange Mainnet","api_key":"룪⸈굫왞䆤⩇წ㦨僮䡅錟ֱ뮬龉짰䂻ʃጡ뢼崢滫♊棿겻◬홱擗\uda50ವ壋䆄\udbb8F鈮輁韒ؙ聣뫕ቯ۶䁬ﭐ","api_secret":"룪⸅굠왝䆮⨕ჩ㦨傹䡏錝ֱ뮩龋짲䃦ʎ፲룯嵲滩☖棾결▶홱擕\uda0d೥壇䇒\udbb8\u001a鉽轔鞁ُ芖䢄⠟鿠ꅠ췚⇦䨗蹞㿚᐀奱私롛㉪","api_update_date":"12/05/2022, 08:13:09"},"task_data_pair_plain_pretext_592fb5ab-d1dd-448f-8585-d45cd2fbb52f":{"label":"BTC/USDT","value":"BTC/USDT"},"task_data_interval_plain_pretext_592fb5ab-d1dd-448f-8585-d45cd2fbb52f":"555","task_data_spread_percent_plain_pretext_592fb5ab-d1dd-448f-8585-d45cd2fbb52f":"1","task_data_state_plain_pretext_592fb5ab-d1dd-448f-8585-d45cd2fbb52f":"stopped","task_data_date_plain_pretext_592fb5ab-d1dd-448f-8585-d45cd2fbb52f":"13/05/2022, 15:25:50","task_data_amount_plain_pretext_592fb5ab-d1dd-448f-8585-d45cd2fbb52f":"14","task_data_id_plain_pretext_592fb5ab-d1dd-448f-8585-d45cd2fbb52f":"0","api_key":"a83849471ef22435094d1536d3287ad14c691cc3","api_secret":"a58873f24e1804672d9fbfc4829b7c9a856eb60ed1b8148a32"}}
    // return res.status(200).send('data23423235123')
  } catch (e: any) {
    logger.error('encrypt_login: ' + e.toString() + " for__:" + encryptData(JSON.stringify(req.body)))
    return res.status(500).json({
      'message': 'Unexpected error'
    })
  }
}


export {
  my_services,
  create_new,
  encrypt_login
}



async function callCreateNewURL(url: string, req_body: any, res: Response) {
  try {
    console.log(req_body.body)
    let _res = await axios.post(url, {
      body: req_body.body
    })
    logger.info("create_new_function: " + JSON.stringify(_res.data))
    return res.status(200).send(_res.data.message)
  } catch(e: any) {
    logger.info("create_new_function_error: " + e.toString() + " from: " + url + " for__:" + encryptData(JSON.stringify(req_body)))
  }
    // Under different circumstances retries can halt server so avoid them for now....
    // serverTurn++
    // if(serverTurn > maxServers) {
    //   serverTurn = 1
    // }
    // callCreateNewURL(url, req_body)
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
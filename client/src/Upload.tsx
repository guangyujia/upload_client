import React, { ChangeEvent } from 'react'
import {Row, Col, Input} from 'antd'

const Upload = function() {
    const handleChange = (event:ChangeEvent<HTMLInputElement>) => {

    }
  return (<div>
    <Row>
        <Col span={12}>
            <Input type='file' style={{width: 300}} onChange={handleChange}/>
        </Col>
        <Col span={12}>
            
        </Col>
    </Row>
  </div>)
}

export default Upload;
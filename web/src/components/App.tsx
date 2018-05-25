import * as React from "react"
import { withRouter } from "react-router"
import { connect } from "react-redux"
import { RouteComponentProps } from "react-router"
import { bindActionCreators, Dispatch, AnyAction } from "redux"

import ErrorComponent from "components/Error"
import SideBar from "components/SideBar"

import * as RemoteData from "data/remote-data"
import { StoreState, AggregatedError } from "data/types"
import { fetchErrors, setActiveError } from "data/errors"

import { Grid, Row, Col } from "react-bootstrap"

interface ConnectedProps {
  errors: RemoteData.RemoteData<any, AggregatedError[]>,
  services: RemoteData.RemoteData<any, string[]>,
  activeError: AggregatedError,
  activeService: string,
}

interface DispatchProps {
  fetchErrors: (service: string) => void
  setActiveError: (errorKey: string) => void
}

type Props = ConnectedProps & DispatchProps & RouteComponentProps<{service: string, errorKey: string}>

class App extends React.Component<Props> {

  constructor(props, context) {
    super(props, context)
    this.handlerErrorSelect = this.handlerErrorSelect.bind(this)
  }

  componentWillMount() {
    if (RemoteData.isSuccess(this.props.services)) {
      this.props.fetchErrors(this.props.match.params.service)
    }
  }

  componentDidUpdate() {
    if (RemoteData.isSuccess(this.props.services)) {
      if (
        this.props.services.data.includes(this.props.match.params.service) &&
        (this.props.activeService !== this.props.match.params.service) &&
        !RemoteData.isLoading(this.props.errors)) {
          this.props.fetchErrors(this.props.match.params.service)
      }
    }

    if (RemoteData.isSuccess(this.props.errors)) {
      let activeError = this.props.errors.data.find(e => e.aggregation_key === this.props.match.params.errorKey)
      if (
        activeError != undefined &&
        (this.props.activeError !== this.props.match.params.errorKey) &&
        !RemoteData.isLoading(this.props.errors)) {
          this.props.setActiveError(activeError.aggregation_key)
      }
    }
  }

  handlerErrorSelect(errorKey: string) {
    this.props.history.push(`/${this.props.match.params.service}/errors/${errorKey}`)
  }

  renderSideBar() {
    switch (this.props.errors.status) {
      case RemoteData.SUCCESS:
        if (this.props.errors.data.length === 0) {
          return <div>no errors returned by api</div>
        } else {
          return <SideBar errors={this.props.errors.data} handleErrorSelect={this.handlerErrorSelect}/>
        }
      case RemoteData.LOADING:
        return <div>fetching errors...</div>
    }
  }

  renderError() {
    switch (this.props.errors.status) {
      case RemoteData.SUCCESS:
      if ((this.props.errors.data.length !== 0 && this.props.activeError !== undefined)) {
        return <ErrorComponent activeError={this.props.activeError} />
      }
    }
  }

  render() {
    return (
      <div>
          <Grid fluid>
            <Row className="show-grid">
              <Col xs={3} id="left-column">
                {this.renderSideBar()}
              </Col>
              <Col xs={9} id="right-column">
                {this.renderError()}
              </Col>
            </Row>
          </Grid>
        </div>
    )
  }
}

const mapStateToProps = (state: StoreState) => {
  return {
    errors: state.errorsReducer.errors,
    activeError: state.errorsReducer.activeError,
    services: state.servicesReducer.services,
    activeService: state.errorsReducer.activeService
  }
}

const matchDispatchToProps = (dispatch: Dispatch<AnyAction>): DispatchProps => {
  return bindActionCreators({ fetchErrors, setActiveError }, dispatch);
}

export default withRouter(connect<ConnectedProps, {}, RouteComponentProps<{service: string}>>(mapStateToProps, matchDispatchToProps)(App))

import React from 'react'
import PropTypes from 'prop-types'
import { Alert } from '@material-ui/lab'
import { withStyles } from '@material-ui/core/styles';
import { colors } from '../../theme'
import { floatToFixed } from '../../utils/numbers'

const styles = () => ({
  infoAlert: {
    width: '100%',
    marginTop: '-12px',
    backgroundColor: colors.gray,
  },
});

const RateInfo = ({
  receivePerSend,
  sendPerReceive,
  fromAsset,
  toAsset,
  classes,
}) => {
  const isNull = (
    !receivePerSend ||
    !sendPerReceive ||
    !fromAsset ||
    !toAsset
  );

  if (isNull) return null;

  return (
    <Alert icon={false} className={classes.infoAlert}>
      Exchange rate {fromAsset}/{toAsset} (including fees): <strong>{floatToFixed(receivePerSend, 4)}</strong>
    </Alert>
  )
}

RateInfo.propTypes = {
  classes: PropTypes.object.isRequired,
  receivePerSend: PropTypes.number,
  sendPerReceive: PropTypes.number,
  fromAsset: PropTypes.number,
  toAsset: PropTypes.number,
}

RateInfo.defaultProps = {
  receivePerSend: undefined,
  sendPerReceive: undefined,
  fromAsset: undefined,
  toAsset: undefined,
}

export default withStyles(styles)(RateInfo);

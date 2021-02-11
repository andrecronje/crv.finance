import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { Alert } from '@material-ui/lab'
import { withStyles } from '@material-ui/core/styles'
import { useHistory } from 'react-router-dom'

const styles = () => ({
  alert: {
    maxWidth: '438px',
    margin: '0 auto',
  },
  link: {
    color: 'inherit',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
});

const AssetLink = ({ erc20address, symbol, classes }) => (
  <a href={`https://etherscan.io/token/${erc20address}`} target="_blank" rel="noopener noreferrer" className={classes.link}>{symbol}</a>
);

const DepositPageLink = ({ pool, classes }) => {
  const history = useHistory();

  return (
    <span onClick={() => history.push(`/liquidity#pool=${pool.id}`)} className={classes.link}>Seed pool yoursel</span>
  );
};

const PoolSeedingCTA = ({
  classes,
  pool,
  isDepositForm,
}) => {
  const poolContainsUnexpectedAssetsCount = pool.assets.length < 2;
  if (poolContainsUnexpectedAssetsCount) return null;

  const firstAsset = pool.assets[0];
  const metaPoolAssets = pool.assets.slice(1);

  return (
    <Alert icon={false} color="warning" className={classes.alert}>
      This pool is still empty. It needs to be seeded with an initial deposit in order to enable swaps.
      {isDepositForm ? (
        <Fragment>
          <br />Assuming an exchange rate of 1:1, this pool should be seeded with 50% <AssetLink {...firstAsset} classes={classes} />, and 50% {metaPoolAssets.map((asset) => <AssetLink {...asset} classes={classes} />).reduce((a, b) => [a, '+', b])}.
        </Fragment>
      ) : (
        <Fragment>
          <br /><DepositPageLink pool={pool} classes={classes} />
        </Fragment>
      )}
    </Alert>
  )
}

PoolSeedingCTA.propTypes = {
  classes: PropTypes.object.isRequired,
  pool: PropTypes.object.isRequired,
  isDepositForm: PropTypes.bool,
}

PoolSeedingCTA.defaultProps = {
  isDepositForm: false,
}

export default withStyles(styles)(PoolSeedingCTA);
